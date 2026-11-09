import assert from 'node:assert/strict';
import test from 'node:test';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { app } from '../src/app.js';
import { env } from '../src/config/env.js';
import { pool } from '../src/config/db.js';

const originalQuery = pool.query;
const insertedApplication = {
  applicationId: 41,
  gymName: 'Northside Strength',
  ownerName: 'Alex Owner',
  email: 'alex@example.com',
  phone: '+1 555 123 4567',
  location: 'Portland, Oregon',
  status: 'Pending',
  appliedAt: '2026-09-26T10:00:00.000Z'
};

test.before(() => {
  pool.query = async (sql, params = []) => {
    const normalized = sql.toLowerCase();
    if (normalized.includes('from users')) {
      return {
        rows: [{ _id: 'super-admin-test', gym: 'admin-gym', name: 'Admin', email: 'admin@example.com', role: 'super_admin', isActive: true }],
        rowCount: 1
      };
    }
    if (normalized.includes('insert into gym_applications')) {
      assert.deepEqual(params, ['Northside Strength', 'Alex Owner', 'alex@example.com', '+1 555 123 4567', 'Portland, Oregon']);
      return { rows: [], rowCount: 1 };
    }
    if (normalized.includes('from gym_applications')) {
      return { rows: [insertedApplication], rowCount: 1 };
    }
    throw new Error(`Unexpected query: ${sql}`);
  };
});

test.after(() => {
  pool.query = originalQuery;
});

test('public gym application submission validates input and normalizes email', async () => {
  const response = await request(app)
    .post('/api/applications/apply')
    .send({
      gymName: 'Northside Strength',
      ownerName: 'Alex Owner',
      email: 'Alex@Example.com',
      phone: '+1 555 123 4567',
      location: 'Portland, Oregon'
    })
    .expect(201);

  assert.match(response.body.message, /submitted/i);
});

test('application listing requires a super-admin token', async () => {
  await request(app).get('/api/applications/').expect(401);

  const token = jwt.sign({ sub: 'super-admin-test', role: 'super_admin', gym_id: 'admin-gym' }, env.JWT_SECRET);
  const response = await request(app)
    .get('/api/applications/')
    .set('Authorization', `Bearer ${token}`)
    .expect(200);

  assert.deepEqual(response.body, [insertedApplication]);
});