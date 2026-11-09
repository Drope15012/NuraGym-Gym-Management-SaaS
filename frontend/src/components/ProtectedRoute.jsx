import { Navigate } from 'react-router-dom';
import { getStoredRole, isAuthenticated, normalizeRole } from '../services/auth';

export default function ProtectedRoute({ allowedRoles, children }) {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles?.length) {
    const role = normalizeRole(getStoredRole());
    const permitted = allowedRoles.some((allowedRole) => normalizeRole(allowedRole) === role);
    if (!permitted) return <Navigate to="/unauthorized" replace />;
  }

  return children;
}