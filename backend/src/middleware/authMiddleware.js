import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { pool } from '../config/db.js';
import { AppError } from './errorHandler.js';

export const ROLE_GROUPS = {
  superAdmin: ['super_admin', 'admin'],
  gymAdmin: ['gym_admin', 'owner'],
  gymManager: ['gym_manager'],
  staff: ['super_admin', 'admin', 'gym_admin', 'owner', 'gym_manager', 'trainer'],
  gymUser: ['gym_admin', 'owner', 'gym_manager', 'trainer', 'member']
};

export function isSuperAdmin(user) {
  return ROLE_GROUPS.superAdmin.includes(user?.role);
}

export function tenantIdFor(user) {
  return isSuperAdmin(user) ? null : user?.gymId;
}

export async function protect(req, _res, next) {
  try {
    const header = req.headers.authorization || '';
    const [type, token] = header.split(' ');

    if (type !== 'Bearer' || !token) {
      throw new AppError('Authentication required', 401);
    }

    const decoded = jwt.verify(token, env.JWT_SECRET);
    const tokenGymId = decoded.gym_id || decoded.gym || null;
    const result = await pool.query(
      `SELECT id AS "_id", gym_id AS gym, name, email, phone, role, is_active AS "isActive"
       FROM users WHERE id = $1`,
      [decoded.sub]
    );
    const user = result.rows[0];

    if (!user || !user.isActive) {
      throw new AppError('Invalid authentication token', 401);
    }

    if (decoded.role && decoded.role !== user.role) {
      throw new AppError('Invalid authentication token', 401);
    }

    if (tokenGymId && user.gym !== tokenGymId) {
      throw new AppError('Invalid authentication token', 401);
    }

    req.user = {
      ...user,
      gymId: user.gym,
      tokenRole: decoded.role,
      tokenGymId
    };
    return next();
  } catch (error) {
    return next(error.statusCode ? error : new AppError('Invalid authentication token', 401));
  }
}

export function authorize(...roles) {
  return (req, _res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this action', 403));
    }
    return next();
  };
}

export function verifyRole(rolesArray) {
  if (!Array.isArray(rolesArray) || rolesArray.length === 0) {
    throw new TypeError('verifyRole requires a non-empty roles array');
  }

  return (req, _res, next) => {
    if (!req.user || !rolesArray.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this action', 403));
    }
    return next();
  };
}

export function authorizeGroup(group) {
  const roles = ROLE_GROUPS[group];
  if (!roles) throw new Error(`Unknown authorization group: ${group}`);
  return verifyRole(roles);
}
