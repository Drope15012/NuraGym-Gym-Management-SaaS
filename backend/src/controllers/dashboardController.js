import { checkDatabase, pool } from '../config/db.js';
import { isSuperAdmin } from '../middleware/authMiddleware.js';

function tenantParams(req) {
  return [isSuperAdmin(req.user) ? 1 : 0, req.user.gymId];
}

export async function getDashboard(req, res, next) {
  try {
    const params = tenantParams(req);
    const [paymentSummary, recentPayments, members, memberships, classes, checkIns] = await Promise.all([
      pool.query(
        `SELECT COALESCE(SUM(amount), 0) AS sales,
                COALESCE(SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END), 0) AS collected,
                COALESCE(SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END), 0) AS pending
           FROM payments WHERE ($1 = 1 OR gym_id = $2)`, params
      ),
      pool.query(
        `SELECT p.id AS "_id", p.amount, p.method, p.status, p.reference,
                p.paid_at AS "paidAt", u.name AS member_name
           FROM payments p JOIN users u ON u.id = p.member_id
          WHERE ($1 = 1 OR p.gym_id = $2)
          ORDER BY p.paid_at DESC LIMIT 10`, params
      ),
      pool.query(
        `SELECT
           SUM(CASE WHEN role = 'member' AND is_active = TRUE THEN 1 ELSE 0 END) AS active,
           SUM(CASE WHEN role = 'member' AND is_active = FALSE THEN 1 ELSE 0 END) AS inactive,
           COUNT(*) AS total
         FROM users WHERE ($1 = 1 OR gym_id = $2)`, params
      ),
      pool.query(
        `SELECT
           SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) AS active,
           SUM(CASE WHEN ends_at <= DATE_ADD(CURRENT_DATE, INTERVAL 30 DAY) THEN 1 ELSE 0 END) AS expiring
         FROM memberships WHERE ($1 = 1 OR gym_id = $2)`, params
      ),
      pool.query(
        `SELECT
           COUNT(*) AS total,
           SUM(CASE WHEN status = 'scheduled' THEN 1 ELSE 0 END) AS scheduled,
           SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed
         FROM classes WHERE ($1 = 1 OR gym_id = $2)`, params
      ),
      pool.query(
        `SELECT COUNT(*) AS total FROM attendance
          WHERE checkin_date = CURRENT_DATE AND ($1 = 1 OR gym_id = $2)`, params
      )
    ]);

    const summary = paymentSummary.rows[0] || {};
    const userCounts = members.rows[0] || {};
    const membershipCounts = memberships.rows[0] || {};
    const classCounts = classes.rows[0] || {};

    res.json({
      metrics: {
        sales: Number(summary.sales || 0),
        paymentsCollected: Number(summary.collected || 0),
        paymentsPending: Number(summary.pending || 0),
        renewals: Number(membershipCounts.active || 0),
        checkIns: Number(checkIns.rows[0]?.total || 0)
      },
      members: {
        active: Number(userCounts.active || 0),
        inactive: Number(userCounts.inactive || 0),
        total: Number(userCounts.total || 0)
      },
      classes: {
        total: Number(classCounts.total || 0),
        scheduled: Number(classCounts.scheduled || 0),
        completed: Number(classCounts.completed || 0)
      },
      memberships: { expiring: Number(membershipCounts.expiring || 0) },
      recentPayments: recentPayments.rows
    });
  } catch (err) {
    console.error(err);
    next(err);
  }
}

export async function getDashboardStats(req, res, next) {
  try {
    const gymCondition = isSuperAdmin(req.user) ? '' : 'AND gym_id = ?';
    const params = isSuperAdmin(req.user) ? [] : [req.user.gymId];

    const [memberResult, revenueResult] = await Promise.all([
      pool.query(
        `SELECT COUNT(*) AS total_members
           FROM users
          WHERE role = 'member' ${gymCondition}`,
        params
      ),
      pool.query(
        `SELECT COALESCE(SUM(amount), 0) AS total_revenue
           FROM payments
          WHERE status = 'paid' ${gymCondition}`,
        params
      )
    ]);

    const totalMembers = Number(memberResult.rows?.[0]?.total_members || 0);
    const totalRevenue = Number(revenueResult.rows?.[0]?.total_revenue || 0);

    res.json({
      totalMembers,
      totalRevenue,
      collectedRevenue: totalRevenue,
      activeMembers: totalMembers
    });
  } catch (err) {
    console.error(err);
    next(err);
  }
}

export async function getPlatformDashboard(_req, res, next) {
  try {
    const [revenue, gyms, users] = await Promise.all([
      pool.query(`SELECT COALESCE(SUM(amount), 0) AS totalRevenue, COUNT(*) AS paidTransactions FROM payments WHERE status = 'paid'`),
      pool.query(`SELECT COUNT(*) AS totalGymTenants, SUM(CASE WHEN status IN ('trial', 'active') THEN 1 ELSE 0 END) AS activeGymTenants FROM gyms WHERE slug <> 'admin'`),
      pool.query(`SELECT COUNT(*) AS totalPlatformUsers FROM users WHERE email NOT LIKE '%@local.nuragym'`)
    ]);
    let systemHealth = 'healthy';
    try {
      await checkDatabase();
    } catch (_error) {
      systemHealth = 'degraded';
    }
    res.json({
      metrics: {
        totalRevenue: Number(revenue.rows[0]?.totalRevenue || 0),
        paidTransactions: Number(revenue.rows[0]?.paidTransactions || 0),
        totalGymTenants: Number(gyms.rows[0]?.totalGymTenants || 0),
        activeGymTenants: Number(gyms.rows[0]?.activeGymTenants || 0),
        totalPlatformUsers: Number(users.rows[0]?.totalPlatformUsers || 0),
        systemHealth
      }
    });
  } catch (err) {
    console.error(err);
    next(err);
  }
}
