import { z } from 'zod';
import { randomUUID } from 'node:crypto';
import { pool } from '../config/db.js';
import { isSuperAdmin } from '../middleware/authMiddleware.js';
import { AppError } from '../middleware/errorHandler.js';

export const membershipSchema = z.object({
  body: z.object({
    gym: z.string().optional(),
    member: z.string(),
    planName: z.string().min(2),
    price: z.number().nonnegative(),
    startsAt: z.coerce.date(),
    endsAt: z.coerce.date(),
    benefits: z.array(z.string()).default([])
  }),
  params: z.object({}),
  query: z.object({})
});

export async function createMembership(req, res, next) {
  try {
    const { gym, member, planName, price, startsAt, endsAt } = req.validated.body;
    const gymId = isSuperAdmin(req.user) ? gym : req.user.gymId;
    if (!gymId) throw new AppError('A gym is required', 400);
    const memberResult = await pool.query('SELECT id FROM users WHERE id = $1 AND gym_id = $2', [member, gymId]);
    if (!memberResult.rowCount) throw new AppError('Member not found in this gym', 404);
    const result = await pool.query(
      `INSERT INTO memberships (id, gym_id, member_id, plan_name, price, starts_at, ends_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id AS "_id", gym_id AS gym, member_id AS member, plan_name AS "planName", price, starts_at AS "startsAt", ends_at AS "endsAt", status`,
      [randomUUID(), gymId, member, planName, price, startsAt, endsAt]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
}

export async function listMemberships(req, res, next) {
  try {
    const result = await pool.query(
      `SELECT m.id AS "_id", m.gym_id AS gym, m.member_id AS "memberId", m.plan_name AS "planName",
          m.price, m.starts_at AS "startsAt", m.ends_at AS "endsAt", m.status,
          JSON_OBJECT('name', u.name, 'email', u.email, 'phone', u.phone) AS member
       FROM memberships m JOIN users u ON u.id = m.member_id
        WHERE ($1 = 1 OR m.gym_id = $2) ORDER BY m.created_at DESC`,
          [isSuperAdmin(req.user) ? 1 : 0, req.user.gymId]
    );
    res.json(result.rows.map((row) => ({ ...row, member: parseJsonValue(row.member) })));
  } catch (error) {
    next(error);
  }
}

function parseJsonValue(value) {
  return typeof value === 'string' ? JSON.parse(value) : value;
}
