import { FastifyInstance, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { isClientAuthorized, sendLoginCode, completeSignIn } from '../telegram/client.js';
import { config } from '../config.js';
import { userRepo, sessionRepo, User, Session } from '../db/index.js';
import { hashPassword, verifyPassword } from '../auth/crypto.js';

export function getSessionFromRequest(request: FastifyRequest): { session: Session; user: User } | null {
  // 1. Check HTTP-only cookie
  const cookieSession = request.cookies?.dart_session;
  if (cookieSession) {
    const res = sessionRepo.get(cookieSession);
    if (res) return res;
  }

  // 2. Check Authorization Bearer header
  const authHeader = request.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    if (token) {
      const res = sessionRepo.get(token);
      if (res) return res;
    }
  }

  // 3. Check query param ?token= (for direct media elements like <img>, <video>, <audio>, <iframe>)
  const query = request.query as { token?: string } | undefined;
  if (query?.token) {
    const res = sessionRepo.get(query.token);
    if (res) return res;
  }

  return null;
}

export async function authRoutes(fastify: FastifyInstance) {
  // Check app authentication & setup status
  fastify.get('/api/auth/setup-status', async (request) => {
    const totalUsers = userRepo.count();
    const current = getSessionFromRequest(request);

    return {
      needsSetup: totalUsers === 0,
      authenticated: Boolean(current),
      user: current ? { id: current.user.id, username: current.user.username } : null,
    };
  });

  // Register master owner account (Only allowed if no user exists yet)
  fastify.post('/api/auth/register-owner', async (request, reply) => {
    if (userRepo.count() > 0) {
      return reply.status(400).send({ error: 'Master account is already configured. Please sign in.' });
    }

    const schema = z.object({
      username: z
        .string()
        .min(3, 'Username must be at least 3 characters')
        .max(30, 'Username cannot exceed 30 characters')
        .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, hyphens, and underscores'),
      password: z.string().min(6, 'Password must be at least 6 characters').max(100),
    });

    const parsed = schema.safeParse(request.body);
    if (!parsed.success) {
      const msg = parsed.error.issues.map((i) => i.message).join(', ');
      return reply.status(400).send({ error: msg });
    }

    const { username, password } = parsed.data;
    const { hash, salt } = hashPassword(password);
    const user = userRepo.create(username.trim(), hash, salt);
    const session = sessionRepo.create(user.id, 30);

    reply.setCookie('dart_session', session.id, {
      path: '/',
      httpOnly: true,
      secure: false, // works on localhost / LAN
      sameSite: 'lax',
      maxAge: 30 * 24 * 3600, // 30 days
    });

    return {
      success: true,
      user: { id: user.id, username: user.username },
      token: session.id,
    };
  });

  // Register a new user account (Multi-user support)
  fastify.post('/api/auth/register', async (request, reply) => {
    const schema = z.object({
      username: z
        .string()
        .min(3, 'Username must be at least 3 characters')
        .max(30, 'Username cannot exceed 30 characters')
        .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, hyphens, and underscores'),
      password: z.string().min(6, 'Password must be at least 6 characters').max(100),
    });

    const parsed = schema.safeParse(request.body);
    if (!parsed.success) {
      const msg = parsed.error.issues.map((i) => i.message).join(', ');
      return reply.status(400).send({ error: msg });
    }

    const { username, password } = parsed.data;
    const cleanUsername = username.trim();

    // Check if username is already taken (case-insensitive)
    const existing = userRepo.getByUsername(cleanUsername);
    if (existing) {
      return reply.status(400).send({ error: 'Username is already taken. Please choose another.' });
    }

    const { hash, salt } = hashPassword(password);
    const user = userRepo.create(cleanUsername, hash, salt);
    const session = sessionRepo.create(user.id, 30);

    reply.setCookie('dart_session', session.id, {
      path: '/',
      httpOnly: true,
      secure: false, // works on localhost / LAN
      sameSite: 'lax',
      maxAge: 30 * 24 * 3600, // 30 days
    });

    return {
      success: true,
      user: { id: user.id, username: user.username },
      token: session.id,
    };
  });

  // Sign in to master account
  fastify.post('/api/auth/login', async (request, reply) => {
    const schema = z.object({
      username: z.string().min(1, 'Username is required'),
      password: z.string().min(1, 'Password is required'),
    });

    const parsed = schema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Username and password are required' });
    }

    const { username, password } = parsed.data;
    const user = userRepo.getByUsername(username.trim());

    if (!user || !verifyPassword(password, user.password_hash, user.salt)) {
      return reply.status(401).send({ error: 'Invalid username or password' });
    }

    const session = sessionRepo.create(user.id, 30);

    reply.setCookie('dart_session', session.id, {
      path: '/',
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 30 * 24 * 3600,
    });

    return {
      success: true,
      user: { id: user.id, username: user.username },
      token: session.id,
    };
  });

  // Sign out / destroy session
  fastify.post('/api/auth/logout', async (request, reply) => {
    const current = getSessionFromRequest(request);
    if (current) {
      sessionRepo.delete(current.session.id);
    }

    reply.clearCookie('dart_session', { path: '/' });
    return { success: true };
  });

  // Get current logged-in user profile
  fastify.get('/api/auth/me', async (request, reply) => {
    const current = getSessionFromRequest(request);
    if (!current) {
      return reply.status(401).send({ error: 'Not authenticated' });
    }

    return {
      authenticated: true,
      user: { id: current.user.id, username: current.user.username },
    };
  });

  // ================= Telegram MTProto Authorization Endpoints =================

  // Check Telegram authorization status
  fastify.get('/api/auth/status', async () => {
    const isConfigured = Boolean(config.telegram.apiId && config.telegram.apiHash);
    let authorized = false;

    if (isConfigured) {
      try {
        authorized = await isClientAuthorized();
      } catch {
        authorized = false;
      }
    }

    return {
      configured: isConfigured,
      authorized,
    };
  });

  // Send login verification code to phone
  fastify.post('/api/auth/send-code', async (request, reply) => {
    const schema = z.object({
      apiId: z.number().int().positive(),
      apiHash: z.string().min(10),
      phoneNumber: z.string().min(7),
    });

    const parsed = schema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.issues });
    }

    const { apiId, apiHash, phoneNumber } = parsed.data;

    try {
      const result = await sendLoginCode(apiId, apiHash, phoneNumber);
      return { success: true, phoneCodeHash: result.phoneCodeHash };
    } catch (err: unknown) {
      const error = err as Error;
      return reply.status(500).send({ error: error.message || 'Failed to send login code' });
    }
  });

  // Verify code and complete login
  fastify.post('/api/auth/sign-in', async (request, reply) => {
    const schema = z.object({
      phoneNumber: z.string().min(7),
      phoneCodeHash: z.string().min(5),
      code: z.string().min(3),
      password: z.string().optional(),
    });

    const parsed = schema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.issues });
    }

    const { phoneNumber, phoneCodeHash, code, password } = parsed.data;

    try {
      await completeSignIn(phoneNumber, phoneCodeHash, code, password);
      return { success: true, message: 'Logged in successfully' };
    } catch (err: unknown) {
      const error = err as Error;
      return reply.status(400).send({ error: error.message || 'Invalid code or password' });
    }
  });
}
