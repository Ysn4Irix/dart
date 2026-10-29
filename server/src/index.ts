import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import { config } from './config.js';
import { initDatabase } from './db/index.js';
import { getTelegramClient } from './telegram/client.js';
import { authRoutes } from './routes/auth.js';
import { folderRoutes } from './routes/folders.js';
import { fileRoutes } from './routes/files.js';
import { shareRoutes } from './routes/shares.js';

const fastify = Fastify({
  logger: {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname',
      },
    },
  },
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

  // 3. Register Routes
  await fastify.register(authRoutes);
  await fastify.register(folderRoutes);
  await fastify.register(fileRoutes);
  await fastify.register(shareRoutes);

  // 4. Background Telegram Connection (if configured)
  if (config.telegram.apiId && config.telegram.apiHash) {
    getTelegramClient()
      .then((client) => {
        if (client) {
          fastify.log.info('Telegram MTProto client connected.');
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
