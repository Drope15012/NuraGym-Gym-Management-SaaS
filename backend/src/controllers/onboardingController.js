import jwt from 'jsonwebtoken';
import { hashPassword } from '../utils/password.js';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { env } from '../config/env.js';
import { pool } from '../config/db.js';

export const onboardingSchema = z.object({
  body: z.object({
    gymName: z.string().min(2),
    slug: z.string().min(2).regex(/^[a-z0-9-]+$/),
    gymEmail: z.string().email(),
    gymPhone: z.string().min(7),
    ownerName: z.string().min(2),
    ownerEmail: z.string().email(),
    ownerPhone: z.string().optional(),
    password: z.string().min(8),
    address: z.object({
      line1: z.string().min(2),
      city: z.string().min(2),
      state: z.string().min(2),
      postalCode: z.string().optional(),
      country: z.string().optional()
    })
  }),
  params: z.object({}),
  query: z.object({})
});

const onboardingBody = onboardingSchema.shape.body;

export const batchOnboardingSchema = z.object({
  body: z.object({
    gyms: z.array(onboardingBody).min(10, 'At least 10 gyms are required per batch').max(100, 'A batch cannot exceed 100 gyms')
  }),
  params: z.object({}),
  query: z.object({})
});

import { AppError } from '../middleware/errorHandler.js';

export async function onboardGym(req, res, next) {
  const client = await pool.connect();

  try {
    const { password, address, ...details } = req.validated.body;
    const gymId = randomUUID();
    const userId = randomUUID();
    const subscriptionId = randomUUID();
    const passwordHash = await hashPassword(password);

    await client.query('BEGIN');
    const gymResult = await client.query(
      `INSERT INTO gyms (id, name, slug, email, phone, address_line1, city, state, postal_code, country)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING id AS "_id", name, slug, email, phone, status`,
      [gymId, details.gymName, details.slug, details.gymEmail.toLowerCase(), details.gymPhone, address.line1, address.city, address.state, address.postalCode || null, address.country || 'India']
    );
    await client.query(
      `INSERT INTO subscriptions (id, gym_id, trial_ends_at) VALUES ($1, $2, DATE_ADD(CURRENT_DATE, INTERVAL 30 DAY))`,
      [subscriptionId, gymId]
    );
    const userResult = await client.query(
      `INSERT INTO users (id, gym_id, name, email, phone, password_hash, role)
      VALUES ($1, $2, $3, $4, $5, $6, 'gym_admin')
       RETURNING id AS "_id", gym_id AS gym, name, email, phone, role, is_active AS "isActive"`,
      [userId, gymId, details.ownerName, details.ownerEmail.toLowerCase(), details.ownerPhone || null, passwordHash]
    );
    await client.query('COMMIT');

    const user = userResult.rows[0];
    const token = jwt.sign({ sub: user._id, role: user.role, gym_id: user.gym }, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN
    });

    res.status(201).json({ token, gym: gymResult.rows[0], user });
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    if (error && typeof error.message === 'string' && /UNIQUE constraint failed: gyms\.slug|duplicate entry.*gyms\.slug|duplicate key|unique constraint/i.test(error.message)) {
      return next(new AppError('A gym with this slug already exists', 409));
    }
    next(error);
  } finally {
    client.release();
  }
}

export async function onboardGymBatch(req, res, next) {
  const client = await pool.connect();

  try {
    const createdGyms = [];
    await client.query('BEGIN');

    for (const gym of req.validated.body.gyms) {
      const { password, address, ...details } = gym;
      const gymId = randomUUID();
      const userId = randomUUID();
      const subscriptionId = randomUUID();
      const passwordHash = await hashPassword(password);
      const gymResult = await client.query(
        `INSERT INTO gyms (id, name, slug, email, phone, address_line1, city, state, postal_code, country)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING id AS "_id", name, slug, email, phone, status`,
        [gymId, details.gymName, details.slug, details.gymEmail.toLowerCase(), details.gymPhone, address.line1, address.city, address.state, address.postalCode || null, address.country || 'India']
      );
      await client.query(
        `INSERT INTO subscriptions (id, gym_id, trial_ends_at) VALUES ($1, $2, DATE_ADD(CURRENT_DATE, INTERVAL 30 DAY))`,
        [subscriptionId, gymId]
      );
      await client.query(
        `INSERT INTO users (id, gym_id, name, email, phone, password_hash, role)
         VALUES ($1, $2, $3, $4, $5, $6, 'gym_admin')`,
        [userId, gymId, details.ownerName, details.ownerEmail.toLowerCase(), details.ownerPhone || null, passwordHash]
      );
      createdGyms.push(gymResult.rows[0]);
    }

    await client.query('COMMIT');
    res.status(201).json({ count: createdGyms.length, gyms: createdGyms });
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    if (error && typeof error.message === 'string' && /UNIQUE constraint failed: gyms\.slug|duplicate key|unique constraint/i.test(error.message)) {
      return next(new AppError('A gym with this slug already exists', 409));
    }
    next(error);
  } finally {
    client.release();
  }
}
