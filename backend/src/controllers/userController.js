import jwt from 'jsonwebtoken';
import { hashPassword, comparePassword } from '../utils/password.js';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { env } from '../config/env.js';
import { pool } from '../config/db.js';
import { AppError } from '../middleware/errorHandler.js';
import { isSuperAdmin } from '../middleware/authMiddleware.js';

function signToken(user) {
  return jwt.sign({ sub: user._id, role: user.role, gym_id: user.gym }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN
  });
}

export const registerSchema = z.object({
  body: z.object({
    gym: z.string(),
    name: z.string().min(2),
    email: z.string().email(),
    phone: z.string().optional(),
    password: z.string().min(8),
    role: z.literal('member').default('member')
  }),
  params: z.object({}),
  query: z.object({})
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().min(1),
    password: z.string().min(1),
    gym: z.string().optional().default('')
  }),
  params: z.object({}),
  query: z.object({})
});

export const memberCreateSchema = z.object({
  body: z.object({
    gym: z.string().min(1).optional(),
    name: z.string().min(2),
    email: z.string().email(),
    phone: z.string().optional(),
    password: z.string().min(8),
    role: z.enum(['gym_manager', 'trainer', 'member']).default('member')
  }),
  params: z.object({}),
  query: z.object({})
});

export async function register(req, res, next) {
  try {
    const { password, ...data } = req.validated.body;
    const gymId = isSuperAdmin(req.user) ? data.gym : req.user?.gymId;
    if (!gymId) throw new AppError('A gym is required', 400);
    const passwordHash = await hashPassword(password);
    const result = await pool.query(
      `INSERT INTO users (id, gym_id, name, email, phone, password_hash, role)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id AS "_id", gym_id AS gym, name, email, phone, role, is_active AS "isActive"`,
      [randomUUID(), gymId, data.name, data.email.toLowerCase(), data.phone || null, passwordHash, data.role]
    );
    const user = result.rows[0];
    const token = signToken(user);
    res.status(201).json({ token, user: sanitizeUser(user) });
  } catch (error) {
    next(error);
  }
}

export async function login(req, res, next) {
  try {
    const { gym, email, password } = req.validated.body;
    const normalizedEmail = email.trim().toLowerCase();
    const loginEmail = normalizedEmail.includes('@')
      ? normalizedEmail
      : `${normalizedEmail}@local.nuragym`;

    const userResult = await pool.query(
      `SELECT id AS "_id", gym_id AS gym, name, email, phone, role,
              is_active AS "isActive", password_hash
         FROM users
        WHERE email = $1
        ORDER BY created_at ASC`,
      [loginEmail]
    );

    if (!userResult.rowCount) {
      throw new AppError('Invalid gym, email, or password', 401);
    }

    let user = null;
    for (const candidate of userResult.rows) {
      if (!candidate.isActive) continue;
      if (!await comparePassword(password, candidate.password_hash)) continue;
      user = candidate;
      break;
    }

    if (!user) {
      throw new AppError('Invalid gym, email, or password', 401);
    }

    const isPlatformAdmin = user.role === 'super_admin' || user.role === 'admin';

    if (!isPlatformAdmin) {
      if (!gym || !gym.trim()) {
        throw new AppError('Invalid gym, email, or password', 401);
      }

      const gymResult = await pool.query(
        'SELECT id FROM gyms WHERE id = $1 OR slug = $1',
        [gym.trim().toLowerCase()]
      );

      if (!gymResult.rowCount) {
        throw new AppError('Gym not found for the supplied gym identifier', 401);
      }

      const matchedGymId = gymResult.rows[0].id;
      if (user.gym !== matchedGymId) {
        throw new AppError('Invalid gym, email, or password', 401);
      }
    }

    res.json({ token: signToken(user), user: sanitizeUser(user) });
  } catch (error) {
    next(error);
  }
}

export async function me(req, res) {
  res.json({ user: sanitizeUser(req.user) });
}

export async function listUsers(req, res, next) {
  try {
    const result = await pool.query(
        `SELECT u.id AS "_id", u.gym_id AS gym, g.name AS "gymName", g.slug AS "gymSlug", u.name, u.email, u.phone, u.role,
          u.is_active AS "isActive", u.created_at AS "createdAt"
       FROM users u JOIN gyms g ON g.id = u.gym_id
         WHERE ($1 = 1 OR u.gym_id = $2) AND u.role NOT IN ('admin', 'super_admin')
       ORDER BY u.created_at DESC`,
        [isSuperAdmin(req.user) ? 1 : 0, req.user.gymId]
    );
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
}

export async function createMember(req, res, next) {
  try {
    const { gym, password, ...data } = req.validated.body;
    const requestedGym = isSuperAdmin(req.user) ? gym : req.user.gymId;
    if (!requestedGym) throw new AppError('A gym is required', 400);
    const gymResult = await pool.query('SELECT id FROM gyms WHERE id = $1 OR slug = $1', [requestedGym]);
    if (!gymResult.rowCount) throw new AppError('Gym not found', 404);
    if (!isSuperAdmin(req.user) && gymResult.rows[0].id !== req.user.gymId) {
      throw new AppError('You do not have permission to use this gym', 403);
    }

    const passwordHash = await hashPassword(password);
    const result = await pool.query(
      `INSERT INTO users (id, gym_id, name, email, phone, password_hash, role)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id AS "_id", gym_id AS gym, name, email, phone, role, is_active AS "isActive"`,
      [randomUUID(), gymResult.rows[0].id, data.name, data.email.toLowerCase(), data.phone || null, passwordHash, data.role]
    );
    const createdUser = await pool.query(
      `SELECT u.id AS "_id", u.gym_id AS gym, g.slug AS "gymSlug", u.name, u.email, u.phone, u.role,
              u.is_active AS "isActive"
         FROM users u JOIN gyms g ON g.id = u.gym_id
        WHERE u.id = $1`,
      [result.rows[0]._id]
    );
    res.status(201).json(createdUser.rows[0]);
  } catch (error) {
    next(error);
  }
}

function sanitizeUser(user) {
  const object = { ...user };
  delete object.password_hash;
  return object;
}
