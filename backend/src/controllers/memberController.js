import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { pool } from '../config/db.js';
import { AppError } from '../middleware/errorHandler.js';
import { hashPassword } from '../utils/password.js';

export const memberSchema = z.object({
  body: z.object({
    name: z.string().min(2),
    email: z.string().email(),
    phone: z.string().optional(),
    password: z.string().min(8).optional(),
    plan: z.string().optional(),
    startDate: z.string().optional(),
    emergencyContactName: z.string().optional(),
    emergencyPhone: z.string().optional()
  }),
  params: z.object({}),
  query: z.object({})
});

export async function listMembers(req, res, next) {
  try {
    const gymId = req.user?.gymId || req.query.gym_id || req.body?.gym_id;
    if (!gymId) {
      throw new AppError('Gym context is required', 400);
    }

    const result = await pool.query(
      `SELECT id AS "_id", gym_id AS gym, name, email, phone, role, is_active AS "isActive", created_at AS "createdAt"
         FROM users
        WHERE gym_id = $1 AND role = 'member'
        ORDER BY created_at DESC`,
      [gymId]
    );

    res.json(result.rows.map((member) => ({
      ...member,
      id: member._id,
      status: 'Active'
    })));
  } catch (error) {
    next(error);
  }
}

export async function createMember(req, res, next) {
  try {
    const gymId = req.user?.gymId;
    if (!gymId) {
      throw new AppError('Gym context is required', 400);
    }

    console.log('POST /api/members payload:', req.body);

    const { name, email, phone, password, plan, startDate, emergencyContactName, emergencyPhone } = req.validated.body;
    const normalizedEmail = email.trim().toLowerCase();
    const memberPassword = password || 'Welcome123!';
    const passwordHash = await hashPassword(memberPassword);
    const memberId = randomUUID();

    await pool.query(
      `INSERT INTO users (id, gym_id, name, email, phone, password_hash, role)
       VALUES ($1, $2, $3, $4, $5, $6, 'member')`,
      [memberId, gymId, name.trim(), normalizedEmail, phone || null, passwordHash]
    );

    const createdResult = await pool.query(
      `SELECT id AS "_id", gym_id AS gym, name, email, phone, role, is_active AS "isActive", created_at AS "createdAt"
         FROM users
        WHERE id = $1`,
      [memberId]
    );

    const member = createdResult.rows[0];
    res.status(201).json({
      ...member,
      id: member._id,
      plan: plan || '1-month',
      startDate: startDate || new Date().toISOString().slice(0, 10),
      emergencyContactName: emergencyContactName || null,
      emergencyPhone: emergencyPhone || null,
      status: 'Active'
    });
  } catch (error) {
    console.error('createMember error:', error);
    next(error);
  }
}
