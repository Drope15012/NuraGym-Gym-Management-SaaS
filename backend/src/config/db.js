import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import mysql from 'mysql2/promise';
import { env } from './env.js';
import { logger } from './logger.js';
import { hashPassword } from '../utils/password.js';

const schemaPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../database/schema.sql');
const poolConfig = {
  host: env.DB_HOST,
  port: env.DB_PORT,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
  waitForConnections: true,
  connectionLimit: env.DB_CONNECTION_LIMIT,
  dateStrings: false
};

const mysqlPool = mysql.createPool(poolConfig);
export const pool = {
  query: (sql, params = []) => query(sql, params, mysqlPool),
  end: () => mysqlPool.end()
};

function normalizeQuery(sql, params = []) {
  const values = [];
  let normalizedSql = sql
    .replace(/\$(\d+)/g, (_match, index) => {
      values.push(params[Number(index) - 1]);
      return '?';
    })
    .replace(/\bAS\s+"([^"]+)"/gi, 'AS `$1`');
  const returningMatch = normalizedSql.match(/\s+RETURNING\s+([\s\S]+)$/i);
  return {
    normalizedSql: returningMatch ? normalizedSql.slice(0, returningMatch.index).trim() : normalizedSql,
    values,
    returning: returningMatch?.[1]
  };
}

async function query(sql, params = [], connection = mysqlPool) {
  const { normalizedSql, values, returning } = normalizeQuery(sql, params);
  const [result] = await connection.query(normalizedSql, values);

  if (returning) {
    const tableMatch = normalizedSql.match(/^INSERT\s+INTO\s+`?([\w]+)`?/i);
    if (!tableMatch) throw new Error('Unable to resolve RETURNING table');
    const [rows] = await connection.query(
      `SELECT ${returning} FROM \`${tableMatch[1]}\` WHERE id = ?`,
      [params[0]]
    );
    return { rows, rowCount: rows.length };
  }

  if (Array.isArray(result)) return { rows: result, rowCount: result.length };
  return { rows: [], rowCount: result.affectedRows ?? 0 };
}

export async function connectDB() {
  const schema = await fs.readFile(schemaPath, 'utf8');
  for (const statement of schema.split(';').map((part) => part.trim()).filter(Boolean)) {
    try {
      await query(statement);
    } catch (error) {
      if (error.code !== 'ER_DUP_KEYNAME') throw error;
    }
  }
  await ensureSchemaCompatibility();
  await ensureLocalAdmin();
  await checkDatabase();
  logger.info(`MySQL database ready at ${env.DB_HOST}:${env.DB_PORT}/${env.DB_NAME}`);
}

async function ensureSchemaCompatibility() {
  try {
    await query('ALTER TABLE gyms MODIFY COLUMN logo_url TEXT NULL');
  } catch (error) {
    if (error.code !== 'ER_BAD_FIELD_ERROR') throw error;
    await query('ALTER TABLE gyms ADD COLUMN logo_url TEXT NULL');
  }
}

export async function checkDatabase() {
  await mysqlPool.query('SELECT 1 AS ok');
  return true;
}

async function ensureLocalAdmin() {
  const adminEmail = env.ADMIN_ID.includes('@')
    ? env.ADMIN_ID.toLowerCase()
    : `${env.ADMIN_ID}@local.nuragym`;
  const localGym = await query('SELECT id FROM gyms WHERE slug = \'admin\' OR slug = \'local-admin\' ORDER BY slug = \'admin\' DESC LIMIT 1');
  const localUser = localGym.rowCount
    ? (await query('SELECT id FROM users WHERE gym_id = $1 ORDER BY created_at ASC LIMIT 1', [localGym.rows[0].id])).rows[0]
    : (await query('SELECT id FROM users WHERE email = $1', [adminEmail])).rows[0];

  if (localUser) {
    await query(
      `UPDATE users
          SET email = $1, password_hash = $2, role = 'super_admin', is_active = TRUE
        WHERE id = $3`,
      [adminEmail, await hashPassword(env.ADMIN_PASSWORD), localUser.id]
    );
    if (localGym.rowCount && localGym.rows[0].slug === 'local-admin') {
      await query('UPDATE gyms SET slug = \'admin\' WHERE id = $1', [localGym.rows[0].id]);
    }
    return;
  }

  const gymId = randomUUID();
  await query(
    `INSERT INTO gyms (id, name, slug, email, phone, address_line1, city, state, country)
    VALUES ($1, 'NuraGym Administration', 'admin', $2, '0000000000', 'Local installation', 'Local', 'Local', 'Local')`,
    [gymId, adminEmail]
  );
  await query('INSERT INTO subscriptions (id, gym_id, status) VALUES ($1, $2, \'active\')', [randomUUID(), gymId]);
  await query(
    `INSERT INTO users (id, gym_id, name, email, password_hash, role)
     VALUES ($1, $2, $3, $4, $5, 'super_admin')`,
    [randomUUID(), gymId, 'Local administrator', adminEmail, await hashPassword(env.ADMIN_PASSWORD)]
  );
  logger.info(`Local admin account ready: ${env.ADMIN_ID}`);
}

export async function disconnectDB() {
  await pool.end();
}

pool.connect = async () => {
  const connection = await mysqlPool.getConnection();
  return {
    query: async (sql, params = []) => {
      if (/^\s*BEGIN\b/i.test(sql)) return connection.beginTransaction();
      if (/^\s*COMMIT\b/i.test(sql)) return connection.commit();
      if (/^\s*ROLLBACK\b/i.test(sql)) return connection.rollback();
      return query(sql, params, connection);
    },
    release: () => connection.release()
  };
};
