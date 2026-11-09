import { z } from 'zod';
import { pool } from '../config/db.js';

export const applyGymSchema = z.object({
  body: z.object({
    gymName: z.string().trim().min(2).max(255),
    ownerName: z.string().trim().min(2).max(255),
    email: z.string().trim().email().max(255),
    phone: z.string().trim().min(7).max(50),
    location: z.string().trim().min(2).max(255)
  }),
  params: z.object({}),
  query: z.object({})
});

export async function createGymApplication(req, res, next) {
  try {
    const { gymName, ownerName, email, phone, location } = req.validated.body;
    await pool.query(
      `INSERT INTO gym_applications (gym_name, owner_name, email, phone, location)
       VALUES ($1, $2, $3, $4, $5)`,
      [gymName, ownerName, email.toLowerCase(), phone, location]
    );
    res.status(201).json({ message: 'Application submitted successfully.' });
  } catch (error) {
    next(error);
  }
}

export async function listGymApplications(_req, res, next) {
  try {
    const result = await pool.query(
      `SELECT application_id AS applicationId,
              gym_name AS gymName,
              owner_name AS ownerName,
              email,
              phone,
              location,
              status,
              applied_at AS appliedAt
       FROM gym_applications
       ORDER BY applied_at DESC, application_id DESC`
    );
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
}