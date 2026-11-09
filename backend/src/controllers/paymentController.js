import { z } from 'zod';
import { randomUUID } from 'node:crypto';
import { pool } from '../config/db.js';
import { AppError } from '../middleware/errorHandler.js';
import { isSuperAdmin } from '../middleware/authMiddleware.js';

export const paymentSchema = z.object({
  body: z.object({
    gym: z.string().optional(),
    member: z.string(),
    membership: z.string().optional(),
    amount: z.number().nonnegative(),
    method: z.enum(['cash', 'card', 'upi', 'bank_transfer']),
    status: z.enum(['pending', 'paid', 'failed', 'refunded']).default('paid'),
    reference: z.string().optional()
  }),
  params: z.object({}),
  query: z.object({})
});

export async function createPayment(req, res, next) {
  try {
    const { gym, member, membership, amount, method, status, reference } = req.validated.body;
    const gymId = isSuperAdmin(req.user) ? gym : req.user.gymId;
    if (!gymId) throw new AppError('A gym is required', 400);
    const memberResult = await pool.query('SELECT id FROM users WHERE id = $1 AND gym_id = $2', [member, gymId]);
    if (!memberResult.rowCount) throw new AppError('Member not found in this gym', 404);
    if (membership) {
      const membershipResult = await pool.query(
        'SELECT id FROM memberships WHERE id = $1 AND gym_id = $2 AND member_id = $3',
        [membership, gymId, member]
      );
      if (!membershipResult.rowCount) throw new AppError('Membership not found in this gym', 404);
    }
    const result = await pool.query(
      `INSERT INTO payments (id, gym_id, member_id, membership_id, amount, method, status, reference)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id AS "_id", gym_id AS gym, member_id AS member, membership_id AS membership, amount, method, status, reference, paid_at AS "paidAt"`,
      [randomUUID(), gymId, member, membership || null, amount, method, status, reference || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
}

export async function listPayments(req, res, next) {
  try {
    const result = await pool.query(
      `SELECT p.id AS "_id", p.gym_id AS gym, p.member_id AS "memberId", p.membership_id AS "membershipId",
          p.amount, p.method, p.status, p.reference, p.paid_at AS "paidAt",
          JSON_OBJECT('name', u.name, 'email', u.email) AS member,
          CASE WHEN m.id IS NULL THEN NULL ELSE JSON_OBJECT('planName', m.plan_name) END AS membership
       FROM payments p JOIN users u ON u.id = p.member_id
       LEFT JOIN memberships m ON m.id = p.membership_id
        WHERE ($1 = 1 OR p.gym_id = $2) ORDER BY p.paid_at DESC`,
          [isSuperAdmin(req.user) ? 1 : 0, req.user.gymId]
    );
    res.json(result.rows.map((row) => ({
      ...row,
      member: parseJsonValue(row.member),
      membership: row.membership ? parseJsonValue(row.membership) : null
    })));
  } catch (error) {
    next(error);
  }
}

export async function listRecentPayments(req, res, next) {
  try {
    const result = await pool.query(
      `SELECT p.id AS "_id", p.gym_id AS gym, p.amount, p.method, p.status,
          p.reference, p.paid_at AS "paidAt",
          JSON_OBJECT('name', u.name, 'email', u.email) AS member
       FROM payments p JOIN users u ON u.id = p.member_id
      WHERE ($1 = 1 OR p.gym_id = $2)
      ORDER BY p.paid_at DESC LIMIT 10`,
      [isSuperAdmin(req.user) ? 1 : 0, req.user.gymId]
    );
    res.json(result.rows.map((row) => ({ ...row, member: parseJsonValue(row.member) })));
  } catch (error) {
    next(error);
  }
}

export async function getPaymentSummary(req, res, next) {
  try {
    const result = await pool.query(
      `SELECT
          COALESCE(SUM(amount), 0) AS sales,
          COALESCE(SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END), 0) AS collected,
          COALESCE(SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END), 0) AS pending
       FROM payments
      WHERE ($1 = 1 OR gym_id = $2)`,
      [isSuperAdmin(req.user) ? 1 : 0, req.user.gymId]
    );
    res.json(result.rows[0] || { sales: 0, collected: 0, pending: 0 });
  } catch (error) {
    next(error);
  }
}

function parseJsonValue(value) {
  return typeof value === 'string' ? JSON.parse(value) : value;
}
