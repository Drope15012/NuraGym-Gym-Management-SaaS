import assert from 'node:assert/strict';
import test from 'node:test';
import request from 'supertest';
import { randomUUID } from 'node:crypto';
import { app } from '../src/app.js';
import { connectDB, disconnectDB } from '../src/config/db.js';

const uniqueSlug = `duplicate-slug-${randomUUID()}`;
const baseGym = {
  gymName: 'Test Gym',
  slug: uniqueSlug,
  gymEmail: 'owner@example.com',
  gymPhone: '9876543210',
  ownerName: 'Owner Name',
  ownerEmail: 'owner@example.com',
  ownerPhone: '9876543210',
  password: 'secret123',
  address: {
    line1: 'Main branch',
    city: 'Mumbai',
    state: 'Maharashtra',
    country: 'India'
  }
};

test.before(async () => {
  await connectDB();
});

test.after(async () => {
  await disconnectDB();
});

test('onboarding rejects duplicate gym slugs with a 409 response', async () => {
  const first = await request(app)
    .post('/api/onboarding')
    .send(baseGym)
    .expect(201);

  assert.ok(first.body.token);

  const second = await request(app)
    .post('/api/onboarding')
    .send({ ...baseGym, ownerEmail: 'second-owner@example.com', gymEmail: 'second@example.com' })
    .expect(409);

  assert.match(second.body.message, /already exists|slug/i);
});
