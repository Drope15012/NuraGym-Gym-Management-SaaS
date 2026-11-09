import { z } from 'zod';
import { randomUUID } from 'node:crypto';
import { pool } from '../config/db.js';
import { AppError } from '../middleware/errorHandler.js';
import { isSuperAdmin } from '../middleware/authMiddleware.js';

export const classSchema = z.object({
  body: z.object({
    gym: z.string().optional(),
    title: z.string().min(2),
    description: z.string().optional(),
    trainer: z.string(),
    startsAt: z.coerce.date(),
    durationMinutes: z.number().int().min(15).max(240),
    capacity: z.number().int().min(1)
  }),
  params: z.object({}),
  query: z.object({})
});

export async function createClass(req, res, next) {
  try {
    const { gym, title, description, trainer, startsAt, durationMinutes, capacity } = req.validated.body;
    const gymId = isSuperAdmin(req.user) ? gym : req.user.gymId;
    if (!gymId) throw new AppError('A gym is required', 400);
    const trainerResult = await pool.query('SELECT id FROM users WHERE id = $1 AND gym_id = $2 AND role IN (\'trainer\', \'owner\', \'admin\')', [trainer, gymId]);
    if (!trainerResult.rowCount) throw new AppError('Trainer not found in this gym', 404);
    const result = await pool.query(
      `INSERT INTO classes (id, gym_id, title, description, trainer_id, starts_at, duration_minutes, capacity)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id AS "_id", gym_id AS gym, title, description, trainer_id AS trainer, starts_at AS "startsAt", duration_minutes AS "durationMinutes", capacity, status`,
      [randomUUID(), gymId, title, description || null, trainer, startsAt, durationMinutes, capacity]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
}

export async function listClasses(req, res, next) {
  try {
    const result = await pool.query(
        `SELECT c.id AS "_id", c.gym_id AS gym, c.title, c.description,
          c.trainer_id AS "trainerId", c.starts_at AS "startsAt", c.duration_minutes AS "durationMinutes",
          c.capacity, c.status,
          json_object('name', trainer.name, 'email', trainer.email) AS trainer,
          COALESCE((SELECT JSON_ARRAYAGG(JSON_OBJECT('id', attendee.id, 'name', attendee.name, 'email', attendee.email))
            FROM class_attendees ca JOIN users attendee ON attendee.id = ca.user_id
            WHERE ca.class_id = c.id), JSON_ARRAY()) AS attendees
       FROM classes c JOIN users trainer ON trainer.id = c.trainer_id
        WHERE ($1 = 1 OR c.gym_id = $2) ORDER BY c.starts_at ASC`,
          [isSuperAdmin(req.user) ? 1 : 0, req.user.gymId]
    );
    res.json(result.rows.map((row) => ({
      ...row,
      trainer: parseJsonValue(row.trainer),
      attendees: parseJsonValue(row.attendees)
    })));
  } catch (error) {
    next(error);
  }
}

function parseJsonValue(value) {
  return typeof value === 'string' ? JSON.parse(value) : value;
}

export async function bookClass(req, res, next) {
  try {
    const classResult = await pool.query('SELECT id, capacity FROM classes WHERE id = $1 AND gym_id = $2', [req.params.id, req.user.gymId]);
    const classSession = classResult.rows[0];
    if (!classSession) throw new AppError('Class not found', 404);
    const countResult = await pool.query('SELECT COUNT(*) AS count FROM class_attendees WHERE class_id = $1', [classSession.id]);
    if (countResult.rows[0].count >= classSession.capacity) throw new AppError('Class is full', 409);
    await pool.query('INSERT INTO class_attendees (class_id, user_id) VALUES ($1, $2) ON DUPLICATE KEY UPDATE class_id = VALUES(class_id)', [classSession.id, req.user._id]);
    res.json({ ...classSession, _id: classSession.id });
  } catch (error) {
    next(error);
  }
}
