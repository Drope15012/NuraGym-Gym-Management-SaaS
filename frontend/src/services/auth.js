import { api } from './api';

export async function login(credentials) {
  const { data } = await api.post('/users/login', credentials);
  localStorage.setItem('nuragym_token', data.token);
  localStorage.setItem('nuragym_user', JSON.stringify(data.user));
  localStorage.setItem('nuragym_role', data.user.role);
  return data;
}

export async function register(payload) {
  const { data } = await api.post('/users/register', payload);
  localStorage.setItem('nuragym_token', data.token);
  localStorage.setItem('nuragym_user', JSON.stringify(data.user));
  localStorage.setItem('nuragym_role', data.user.role);
  return data;
}

export function logout() {
  localStorage.removeItem('nuragym_token');
  localStorage.removeItem('nuragym_user');
  localStorage.removeItem('nuragym_role');
}

export function getStoredUser() {
  const raw = localStorage.getItem('nuragym_user');
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function normalizeRole(role) {
  const normalized = String(role || '').trim().toLowerCase().replace(/[\s-]+/g, '_');
  if (normalized === 'superadmin') return 'super_admin';
  if (normalized === 'gymowner') return 'gym_admin';
  return normalized;
}

export function getStoredRole() {
  return localStorage.getItem('nuragym_role') || getStoredUser()?.role || '';
}

export function isAuthenticated() {
  return Boolean(localStorage.getItem('nuragym_token') && getStoredUser() && getStoredRole());
}

export function getDashboardPath(role) {
  switch (normalizeRole(role)) {
    case 'super_admin':
    case 'admin':
      return '/super-admin';
    case 'gym_admin':
    case 'owner':
      return '/gym-admin/dashboard';
    case 'gym_manager':
      return '/gym-manager/dashboard';
    default:
      return '/unauthorized';
  }
}
