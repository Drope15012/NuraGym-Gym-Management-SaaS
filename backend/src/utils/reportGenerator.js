import { pool } from '../config/db.js';

export async function buildGymSummary(gymId) {
  const result = await pool.query(
    `SELECT
      (SELECT COUNT(*) FROM users WHERE gym_id = $1 AND role = 'member' AND is_active = TRUE) AS members,
      (SELECT COUNT(*) FROM memberships WHERE gym_id = $1 AND status = 'active') AS "activeMemberships",
      COALESCE((SELECT SUM(amount) FROM payments WHERE gym_id = $1 AND status = 'paid'), 0) AS revenue`,
    [gymId]
  );
  return result.rows[0];
}
