import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { pool } from '../config/db.js';
import { AppError } from '../middleware/errorHandler.js';

export const memberSearchSchema = z.object({
  params: z.object({}),
  body: z.object({}),
  query: z.object({ query: z.string().trim().max(120).default('') })
});

export const checkInSchema = z.object({
  params: z.object({}),
  query: z.object({}),
  body: z.object({ memberId: z.string().min(1) })
});

function gymFilter(req) {
  return [req.user.role === 'admin' || req.user.role === 'super_admin' ? 1 : 0, req.user.gymId];
}

export async function searchMembers(req, res, next) {
  try {
    const [isSuperAdmin, gymId] = gymFilter(req);
    const query = req.validated.query.query;
    const term = `%${query}%`;
    const result = await pool.query(
      `SELECT u.id AS "_id", u.gym_id AS gym, u.name, u.email, u.phone,
              u.is_active AS "isActive",
              EXISTS (
                SELECT 1 FROM attendance a
                WHERE a.member_id = u.id AND a.gym_id = u.gym_id AND a.checkin_date = CURRENT_DATE
              ) AS "checkedInToday"
         FROM users u
        WHERE u.role = 'member' AND u.is_active = TRUE
          AND ($1 = 1 OR u.gym_id = $2)
          AND (u.name LIKE $3 OR u.email LIKE $3 OR COALESCE(u.phone, '') LIKE $3)
        ORDER BY u.name ASC LIMIT 25`,
      [isSuperAdmin, gymId, term]
    );
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
}

export async function checkInMember(req, res, next) {
  try {
    const [isSuperAdmin, gymId] = gymFilter(req);
    const { memberId } = req.validated.body;
    const member = await pool.query(
      `SELECT id AS "_id", gym_id AS gym, name, email, phone
         FROM users
        WHERE id = $1 AND role = 'member' AND is_active = TRUE
          AND ($2 = 1 OR gym_id = $3)`,
      [memberId, isSuperAdmin, gymId]
    );
    if (!member.rowCount) throw new AppError('Member not found in this gym', 404);

    const existing = await pool.query(
      'SELECT id AS "_id", checked_in_at AS "checkedInAt" FROM attendance WHERE member_id = $1 AND gym_id = $2 AND checkin_date = CURRENT_DATE',
      [memberId, member.rows[0].gym]
    );
    if (existing.rowCount) {
      return res.json({ member: member.rows[0], attendance: existing.rows[0], alreadyCheckedIn: true });
    }

    const result = await pool.query(
      `INSERT INTO attendance (id, gym_id, member_id, checkin_date)
       VALUES ($1, $2, $3, CURRENT_DATE)
       RETURNING id AS "_id", checked_in_at AS "checkedInAt", checkin_date AS "checkinDate"`,
      [randomUUID(), member.rows[0].gym, memberId]
    );
    res.status(201).json({ member: member.rows[0], attendance: result.rows[0], alreadyCheckedIn: false });
  } catch (error) {
    next(error);
  }
}

export async function listTodayCheckIns(req, res, next) {
  try {
    const [isSuperAdmin, gymId] = gymFilter(req);
    const result = await pool.query(
      `SELECT a.id AS "_id", a.gym_id AS gym, a.member_id AS "memberId",
              a.checked_in_at AS "checkedInAt", u.name, u.email, u.phone
         FROM attendance a JOIN users u ON u.id = a.member_id
        WHERE a.checkin_date = CURRENT_DATE AND ($1 = 1 OR a.gym_id = $2)
        ORDER BY a.checked_in_at DESC`,
      [isSuperAdmin, gymId]
    );
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
}
