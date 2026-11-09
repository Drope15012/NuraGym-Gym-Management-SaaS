import assert from 'node:assert/strict';
import test from 'node:test';
import { login } from '../src/controllers/userController.js';
import { pool } from '../src/config/db.js';
import { hashPassword } from '../src/utils/password.js';

test('super admin login ignores tenant slug validation', async () => {
  const originalQuery = pool.query;
  const passwordHash = await hashPassword('15012');

  pool.query = async (sql, params = []) => {
    const normalized = sql.toLowerCase();

    if (normalized.includes('from users')) {
      return {
        rows: [
          {
            _id: 'super-user-1',
            gym: 'gym_admin',
            name: 'Super Administrator',
            email: '15012@15012.com',
            phone: null,
            role: 'super_admin',
            isActive: true,
            password_hash: passwordHash
          }
        ],
        rowCount: 1
      };
    }

    if (normalized.includes('from gyms')) {
      return { rows: [], rowCount: 0 };
    }

    return { rows: [], rowCount: 0 };
  };

  try {
    const req = {
      validated: {
        body: {
          email: '15012@15012.com',
          password: '15012',
          gym: 'ignored-tenant-slug'
        }
      }
    };

    const res = {
      json(payload) {
        assert.equal(payload.user.email, '15012@15012.com');
        assert.equal(payload.user.role, 'super_admin');
        assert.ok(payload.token);
      }
    };

    await login(req, res, () => {});
  } finally {
    pool.query = originalQuery;
  }
});
