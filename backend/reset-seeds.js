import { pool } from './src/config/db.js';

const resetQueries = [
  "DELETE FROM users WHERE email IN ('nura@gmail.com', '15012@15012.com', 'gym@gym.com')",
  "DELETE FROM subscriptions WHERE gym_id = 'gym_admin'",
  "DELETE FROM gyms WHERE id = 'gym_admin' OR slug = 'gym-admin'",
  "INSERT INTO gyms (id, name, slug, email, phone, address_line1, city, state, country, status) VALUES ('gym_admin', 'Gym Administration', 'gym-admin', 'gym@gym.com', '0000000000', 'Local installation', 'Local', 'Local', 'Local', 'active')",
  "INSERT INTO subscriptions (id, gym_id, status) VALUES ('subscription_admin', 'gym_admin', 'active')",
  "INSERT INTO users (id, gym_id, name, email, password_hash, role) VALUES ('user_admin', 'gym_admin', 'Super Administrator', '15012@15012.com', '$2a$12$aMuQ5xvW2SbqMPmvKJikd.jjhOyE/cFIi9gNymww0HHWgy0e9j6Xi', 'super_admin')",
  "INSERT INTO users (id, gym_id, name, email, password_hash, role) VALUES ('user_gym_admin', 'gym_admin', 'Gym Admin', 'gym@gym.com', '$2a$12$aBL8r5mjRaGnk4X3ABTcfuRvdUyAXQAltY2gdVq0gkvSK8P1RNUry', 'gym_admin')"
];

async function main() {
  try {
    for (const query of resetQueries) {
      await pool.query(query);
    }
    console.log('Seed reset complete. Correct login accounts are loaded.');
  } catch (error) {
    console.error('Seed reset failed:', error?.message || error);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

main();
