import path from 'node:path';
import fs from 'node:fs';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import fastifyCookie from '@fastify/cookie';
import fastifyStatic from '@fastify/static';
import { config, getClientDistPath } from './config.js';
import { initDatabase } from './db/index.js';
import { getTelegramClient } from './telegram/client.js';
import { syncSavedMessages } from './telegram/sync.js';
import { authRoutes, getSessionFromRequest } from './routes/auth.js';
import { folderRoutes } from './routes/folders.js';
import { fileRoutes } from './routes/files.js';
import { shareRoutes } from './routes/shares.js';

const fastify = Fastify({
  logger: true,
  bodyLimit: 1024 * 1024 * 1024 * 2, // 2GB body limit
});

async function bootstrap() {
  // 1. Initialize SQLite Database
  initDatabase();
  fastify.log.info('Database initialized at ' + config.dbPath);

  // 2. Register Middleware
  await fastify.register(cors, {
    origin: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  await fastify.register(multipart, {
    limits: {
      fileSize: 1024 * 1024 * 1024 * 4, // 4GB max file size
      files: 1,
    },
  });

  await fastify.register(fastifyCookie);

  // Global Auth Guard: Protect internal and cloud storage API routes
  fastify.addHook('preHandler', async (request, reply) => {
    const pathname = request.url.split('?')[0];

    // 1. CORS preflight is always permitted
    if (request.method === 'OPTIONS') {
      return;
    }

    // 2. Public auth endpoints needed for setup and signing in
    if (
      pathname === '/api/auth/setup-status' ||
      pathname === '/api/auth/register-owner' ||
      pathname === '/api/auth/login'
    ) {
      return;
    }

    // 3. Public share links for reading metadata, streaming, and downloading
    if (
      request.method === 'GET' &&
      (pathname.startsWith('/s/') || pathname.startsWith('/api/shares/'))
    ) {
      return;
    }

    // 4. All other /api/* endpoints require a valid authenticated master session
    if (pathname.startsWith('/api/')) {
      const auth = getSessionFromRequest(request);
      if (!auth) {
        return reply.status(401).send({ error: 'Unauthorized: Master account sign-in required' });
      }
    }
  });

  // 3. Register Routes
  await fastify.register(authRoutes);
  await fastify.register(folderRoutes);
  await fastify.register(fileRoutes);
  await fastify.register(shareRoutes);

  // 4. Serve Static Frontend (Production / Docker mode)
  const clientDist = getClientDistPath();

  if (clientDist) {
    fastify.log.info(`Serving static client assets from: ${clientDist}`);
    await fastify.register(fastifyStatic, {
      root: clientDist,
      prefix: '/',
      wildcard: false,
    });

    // SPA fallback: any non-API route serves index.html
    fastify.setNotFoundHandler(async (request, reply) => {
      const pathname = request.url.split('?')[0];
      if (pathname.startsWith('/api/')) {
        return reply.status(404).send({ error: 'Endpoint not found' });
      }
      return reply.status(200).sendFile('index.html');
    });
  }

  // 5. Background Telegram Connection (if configured)
  if (config.telegram.apiId && config.telegram.apiHash) {
    getTelegramClient()
      .then(async (client) => {
        if (client) {
          fastify.log.info('Telegram MTProto client connected.');
          const isAuth = await client.isUserAuthorized().catch(() => false);
          if (isAuth) {
            fastify.log.info('Starting background sync of Saved Messages...');
            syncSavedMessages(100)
              .then((res) => {
                fastify.log.info(
                  `Background sync complete: scanned ${res.scanned}, added ${res.added}, skipped ${res.skipped}`
                );
              })
              .catch((err) => {
                fastify.log.warn('Background sync warning: ' + err.message);
              });
          }
        }
      })
      .catch((err) => {
        fastify.log.warn('Could not auto-connect Telegram client: ' + err.message);
      });
  }

  // 5. Start listening
  try {
    await fastify.listen({ port: config.port, host: config.host });
    fastify.log.info(`Server running on http://${config.host}:${config.port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

bootstrap();
