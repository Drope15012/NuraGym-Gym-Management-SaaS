import { z } from 'zod';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool } from '../config/db.js';
import { AppError } from '../middleware/errorHandler.js';
import { hashPassword } from '../utils/password.js';

export const gymCreateSchema = z.object({
  body: z.object({
    name: z.string().min(2),
    slug: z.string().min(2).regex(/^[a-z0-9-]+$/),
    email: z.string().email(),
    phone: z.string().min(7),
    logoUrl: z.string().max(5_000_000).refine(
      (value) => value === '' || /^https?:\/\//i.test(value) || /^data:image\/(png|jpeg|jpg|webp);base64,/i.test(value),
      'Logo must be an HTTP(S) URL or a supported image upload'
    ).optional(),
    initialAdmin: z.object({
      name: z.string().min(2),
      email: z.string().email(),
      phone: z.string().optional(),
      password: z.string().min(8)
    }),
    address: z.object({
      line1: z.string().min(2),
      line2: z.string().optional(),
      city: z.string().min(2),
      state: z.string().min(2),
      postalCode: z.string().optional(),
      country: z.string().optional()
    })
  }),
  params: z.object({}),
  query: z.object({})
});

const multipartGymSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/),
  email: z.string().email(),
  phone: z.string().min(7),
  location: z.string().min(2),
  adminName: z.string().min(2),
  adminEmail: z.string().email(),
  adminPhone: z.string().optional(),
  adminPassword: z.string().min(8),
  logoUrl: z.string().max(5_000_000).optional()
});

const multipartGymUpdateSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/),
  email: z.string().email(),
  phone: z.string().min(7),
  location: z.string().min(2)
});

function normalizeSlug(value) {
  return String(value || '').toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-');
}

function getCreateFields(body) {
  return {
    name: body.name,
    slug: normalizeSlug(body.slug),
    email: body.email,
    phone: body.phone,
    location: body.location || body.address?.city,
    adminName: body.adminName || body.initialAdmin?.name,
    adminEmail: body.adminEmail || body.initialAdmin?.email,
    adminPhone: body.adminPhone || body.initialAdmin?.phone,
    adminPassword: body.adminPassword || body.initialAdmin?.password,
    logoUrl: body.logoUrl
  };
}

function getUpdateFields(body) {
  return {
    name: body.name,
    slug: normalizeSlug(body.slug),
    email: body.email,
    phone: body.phone,
    location: body.location || body.address?.city
  };
}

function validationMessage(result) {
  return result.error.issues
    .map((issue) => `${issue.path.join('.') || 'request'}: ${issue.message}`)
    .join('; ');
}

export async function createGym(req, res, next) {
  const client = await pool.connect();
  let uploadedPath;
  try {
    const parsedFields = multipartGymSchema.safeParse(getCreateFields(req.body));
    if (!parsedFields.success) {
      throw new AppError(`Validation failed: ${validationMessage(parsedFields)}`, 400, parsedFields.error.flatten());
    }
    const fields = parsedFields.data;
    const id = randomUUID();
    if (req.file) {
      const uploadDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../uploads/gyms');
      await fs.mkdir(uploadDirectory, { recursive: true });
      const extension = req.file.mimetype === 'image/png' ? '.png' : req.file.mimetype === 'image/webp' ? '.webp' : '.jpg';
      const fileName = `${id}${extension}`;
      uploadedPath = path.join(uploadDirectory, fileName);
      await fs.writeFile(uploadedPath, req.file.buffer);
    }
    await client.query('BEGIN');
    const result = await client.query(
      `INSERT INTO gyms (id, name, slug, email, phone, logo_url, address_line1, address_line2, city, state, postal_code, country)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING id AS "_id", name, slug, email, phone, logo_url AS "logoUrl", status`,
      [id, fields.name, fields.slug, fields.email, fields.phone, uploadedPath ? `/uploads/gyms/${path.basename(uploadedPath)}` : fields.logoUrl || null, fields.location, null, fields.location, fields.location, null, 'India']
    );
    await client.query('INSERT INTO subscriptions (id, gym_id) VALUES ($1, $2)', [randomUUID(), id]);
    const passwordHash = await hashPassword(fields.adminPassword);
    const adminResult = await client.query(
      `INSERT INTO users (id, gym_id, name, email, phone, password_hash, role)
       VALUES ($1, $2, $3, $4, $5, $6, 'gym_admin')
       RETURNING id AS "_id", gym_id AS gym, name, email, phone, role, is_active AS "isActive"`,
      [randomUUID(), id, fields.adminName, fields.adminEmail.toLowerCase(), fields.adminPhone || null, passwordHash]
    );
    await client.query('COMMIT');
    res.status(201).json({ gym: result.rows[0], admin: adminResult.rows[0] });
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    if (uploadedPath) await fs.unlink(uploadedPath).catch(() => {});
    if (error.code === 'ER_DUP_ENTRY' && /slug/i.test(error.message)) {
      return next(new AppError('A gym with this URL slug already exists.', 409));
    }
    next(error);
  } finally {
    client.release();
  }
}

export async function deleteGym(req, res, next) {
  const client = await pool.connect();
  try {
    const gymResult = await client.query('SELECT id, slug, logo_url AS logoUrl FROM gyms WHERE id = $1', [req.params.id]);
    if (!gymResult.rowCount) throw new AppError('Gym not found', 404);
    if (gymResult.rows[0].slug === 'admin') throw new AppError('The system gym cannot be deleted', 403);

    await client.query('BEGIN');
    await client.query('DELETE ca FROM class_attendees ca INNER JOIN classes c ON c.id = ca.class_id WHERE c.gym_id = $1', [req.params.id]);
    await client.query('DELETE FROM payments WHERE gym_id = $1', [req.params.id]);
    await client.query('DELETE FROM attendance WHERE gym_id = $1', [req.params.id]);
    await client.query('DELETE FROM memberships WHERE gym_id = $1', [req.params.id]);
    await client.query('DELETE FROM classes WHERE gym_id = $1', [req.params.id]);
    await client.query('DELETE FROM users WHERE gym_id = $1', [req.params.id]);
    await client.query('DELETE FROM subscriptions WHERE gym_id = $1', [req.params.id]);
    await client.query('DELETE FROM gyms WHERE id = $1', [req.params.id]);
    await client.query('COMMIT');

    const logoUrl = gymResult.rows[0].logoUrl;
    if (logoUrl?.startsWith('/uploads/')) {
      await fs.unlink(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..', logoUrl.slice(1))).catch(() => {});
    }
    res.status(204).send();
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    next(error);
  } finally {
    client.release();
  }
}

export async function updateGym(req, res, next) {
  const client = await pool.connect();
  let uploadedPath;
  try {
    const parsedFields = multipartGymUpdateSchema.safeParse(getUpdateFields(req.body));
    if (!parsedFields.success) throw new AppError(`Validation failed: ${validationMessage(parsedFields)}`, 400, parsedFields.error.flatten());
    const current = await client.query('SELECT id, slug, logo_url AS logoUrl FROM gyms WHERE id = $1', [req.params.id]);
    if (!current.rowCount) throw new AppError('Gym not found', 404);
    if (current.rows[0].slug === 'admin') throw new AppError('The system gym cannot be edited', 403);

    if (req.file) {
      const uploadDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../uploads/gyms');
      await fs.mkdir(uploadDirectory, { recursive: true });
      const extension = req.file.mimetype === 'image/png' ? '.png' : req.file.mimetype === 'image/webp' ? '.webp' : '.jpg';
      uploadedPath = path.join(uploadDirectory, `${req.params.id}-${Date.now()}${extension}`);
      await fs.writeFile(uploadedPath, req.file.buffer);
    }

    const fields = parsedFields.data;
    const logoUrl = uploadedPath ? `/uploads/gyms/${path.basename(uploadedPath)}` : current.rows[0].logoUrl;
    const result = await client.query(
      `UPDATE gyms SET name = $1, slug = $2, email = $3, phone = $4, city = $5, state = $5, address_line1 = $5,
              logo_url = $6 WHERE id = $7`,
      [fields.name, fields.slug, fields.email, fields.phone, fields.location, logoUrl, req.params.id]
    );
    if (!result.rowCount) throw new AppError('Gym could not be updated', 409);

    if (uploadedPath && current.rows[0].logoUrl?.startsWith('/uploads/')) {
      await fs.unlink(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..', current.rows[0].logoUrl.slice(1))).catch(() => {});
    }
    res.json({ _id: req.params.id, ...fields, logoUrl });
  } catch (error) {
    if (uploadedPath) await fs.unlink(uploadedPath).catch(() => {});
    if (error.code === 'ER_DUP_ENTRY' && /slug/i.test(error.message)) {
      return next(new AppError('A gym with this URL slug already exists.', 409));
    }
    next(error);
  } finally {
    client.release();
  }
}

export async function listGyms(_req, res, next) {
  try {
    const result = await pool.query(
      `SELECT g.id AS "_id", g.name, g.slug, g.email, g.phone,
              g.city, g.state, g.logo_url AS "logoUrl", g.status,
              g.created_at AS "createdAt",
              (SELECT u.name FROM users u
                WHERE u.gym_id = g.id AND u.role IN ('gym_admin', 'owner')
                ORDER BY u.created_at ASC LIMIT 1) AS "adminName",
              (SELECT u.email FROM users u
                WHERE u.gym_id = g.id AND u.role IN ('gym_admin', 'owner')
                ORDER BY u.created_at ASC LIMIT 1) AS "adminEmail",
              (SELECT u.role FROM users u
                WHERE u.gym_id = g.id AND u.role IN ('gym_admin', 'owner')
                ORDER BY u.created_at ASC LIMIT 1) AS "adminRole"
         FROM gyms g
        ORDER BY g.created_at DESC`
    );
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
}

export async function getGym(req, res, next) {
  try {
    const isSuperAdmin = req.user?.role === 'admin' || req.user?.role === 'super_admin';
    const result = await pool.query(
      `SELECT g.id AS "_id", g.name, g.slug, g.email, g.phone, g.city, g.state,
          g.logo_url AS "logoUrl", g.status, g.created_at AS "createdAt",
          (SELECT u.name FROM users u WHERE u.gym_id = g.id AND u.role IN ('gym_admin', 'owner') ORDER BY u.created_at ASC LIMIT 1) AS "adminName",
          (SELECT u.email FROM users u WHERE u.gym_id = g.id AND u.role IN ('gym_admin', 'owner') ORDER BY u.created_at ASC LIMIT 1) AS "adminEmail",
          (SELECT u.role FROM users u WHERE u.gym_id = g.id AND u.role IN ('gym_admin', 'owner') ORDER BY u.created_at ASC LIMIT 1) AS "adminRole"
         FROM gyms g
        WHERE (g.id = $1 OR g.slug = $1) AND ($2 = 1 OR g.id = $3)`,
      [req.params.id, isSuperAdmin ? 1 : 0, req.user?.gymId]
    );
    if (!result.rowCount) throw new AppError('Gym not found', 404);
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
}
