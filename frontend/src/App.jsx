import { Navigate, NavLink, Route, Routes, useNavigate } from 'react-router-dom';
import { Activity, Building2, ClipboardList, CreditCard, LayoutDashboard, LogOut, Users } from 'lucide-react';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Login from './pages/Login.jsx';
import LandingPage from './pages/LandingPage.jsx';
import Unauthorized from './pages/Unauthorized.jsx';
import Reports from './pages/Reports.jsx';
import PlatformDashboard from './pages/PlatformDashboard.jsx';
import GymTenants from './pages/GymTenants.jsx';
import GymAdminDashboard from './pages/GymAdminDashboard.jsx';
import GymAdminStaff from './pages/GymAdminStaff.jsx';
import GymAdminRevenue from './pages/GymAdminRevenue.jsx';
import GymAdminMembers from './pages/GymAdminMembers.jsx';
import GymAdminSubscriptions from './pages/GymAdminSubscriptions.jsx';
import GymAdminBilling from './pages/GymAdminBilling.jsx';
import GymAdminAttendance from './pages/GymAdminAttendance.jsx';
import GymAdminScheduling from './pages/GymAdminScheduling.jsx';
import GymAdminLeads from './pages/GymAdminLeads.jsx';
import GymAdminCommunications from './pages/GymAdminCommunications.jsx';
import GymAdminInventory from './pages/GymAdminInventory.jsx';
import GymAdminEquipment from './pages/GymAdminEquipment.jsx';
import GymAdminSettings from './pages/GymAdminSettings.jsx';
import GymManagerDashboard from './pages/GymManagerDashboard.jsx';
import AdminApplications from './pages/AdminApplications.jsx';
import { getDashboardPath, getStoredRole, getStoredUser, isAuthenticated, logout, normalizeRole } from './services/auth';

const SUPER_ADMIN_ROLES = ['super_admin', 'admin'];
const GYM_ADMIN_ROLES = ['gym_admin', 'owner'];
const GYM_MANAGER_ROLES = ['gym_manager'];
const APP_ROLES = [...SUPER_ADMIN_ROLES, ...GYM_ADMIN_ROLES, ...GYM_MANAGER_ROLES];

function hasRole(user, roles) {
  return Boolean(user && roles.some((role) => normalizeRole(role) === normalizeRole(user.role)));
}

function PublicOnlyRoute({ children }) {
  if (isAuthenticated()) {
    return <Navigate to={getDashboardPath(getStoredRole())} replace />;
  }
  return children;
}

function Shell() {
  const user = getStoredUser();
  const navigate = useNavigate();

  if (!user) return <Navigate to="/login" replace />;

  const isSuperAdmin = hasRole(user, SUPER_ADMIN_ROLES);
  const isGymAdmin = hasRole(user, GYM_ADMIN_ROLES);
  const isGymManager = hasRole(user, GYM_MANAGER_ROLES);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><Activity size={28} /><div><strong>NuraGym</strong><span>{user.role.replace('_', ' ')}</span></div></div>
        <nav aria-label="Main navigation">
          {isSuperAdmin && <NavLink to="/super-admin" end><LayoutDashboard size={18} /> Dashboard</NavLink>}
          {isSuperAdmin && <NavLink to="/gyms"><Building2 size={18} /> Gym tenants</NavLink>}
          {isSuperAdmin && <NavLink to="/admin/applications"><ClipboardList size={18} /> Applications</NavLink>}
          {isGymAdmin && <NavLink to="/gym-admin/dashboard" end><LayoutDashboard size={18} /> Dashboard</NavLink>}
          {isGymAdmin && <NavLink to="/gym-admin/members"><Users size={18} /> Members</NavLink>}
          {isGymAdmin && <NavLink to="/gym-admin/staff"><Users size={18} /> Staff</NavLink>}
          {isGymAdmin && <NavLink to="/gym-admin/subscriptions"><CreditCard size={18} /> Subscriptions</NavLink>}
          {isGymAdmin && <NavLink to="/gym-admin/billing"><CreditCard size={18} /> Billing</NavLink>}
          {isGymAdmin && <NavLink to="/gym-admin/attendance"><CreditCard size={18} /> Attendance</NavLink>}
          {isGymAdmin && <NavLink to="/gym-admin/scheduling"><CreditCard size={18} /> Scheduling</NavLink>}
          {isGymAdmin && <NavLink to="/gym-admin/leads"><CreditCard size={18} /> Leads</NavLink>}
          {isGymAdmin && <NavLink to="/gym-admin/communications"><CreditCard size={18} /> Communications</NavLink>}
          {isGymAdmin && <NavLink to="/gym-admin/inventory"><CreditCard size={18} /> Inventory</NavLink>}
          {isGymAdmin && <NavLink to="/gym-admin/equipment"><CreditCard size={18} /> Equipment</NavLink>}
          {isGymAdmin && <NavLink to="/gym-admin/settings"><CreditCard size={18} /> Settings</NavLink>}
          {isGymAdmin && <NavLink to="/gym-admin/revenue"><CreditCard size={18} /> Revenue</NavLink>}
          {isGymManager && <NavLink to="/gym-manager/dashboard" end><CreditCard size={18} /> Check-in and POS</NavLink>}
          <NavLink to="/reports"><CreditCard size={18} /> Reports</NavLink>
        </nav>
        <button className="ghost-button" type="button" onClick={() => { logout(); navigate('/login'); }}><LogOut size={18} /> Sign out</button>
      </aside>
      <main>
        <Routes>
          <Route path="/super-admin" element={<ProtectedRoute allowedRoles={SUPER_ADMIN_ROLES}><PlatformDashboard /></ProtectedRoute>} />
          <Route path="/gyms" element={<ProtectedRoute allowedRoles={SUPER_ADMIN_ROLES}><GymTenants /></ProtectedRoute>} />
          <Route path="/admin/applications" element={<ProtectedRoute allowedRoles={SUPER_ADMIN_ROLES}><AdminApplications /></ProtectedRoute>} />
          <Route path="/gym-admin" element={<ProtectedRoute allowedRoles={GYM_ADMIN_ROLES}><Navigate to="/gym-admin/dashboard" replace /></ProtectedRoute>} />
          <Route path="/gym-admin/dashboard" element={<ProtectedRoute allowedRoles={GYM_ADMIN_ROLES}><GymAdminDashboard /></ProtectedRoute>} />
          <Route path="/gym-admin/members" element={<ProtectedRoute allowedRoles={GYM_ADMIN_ROLES}><GymAdminMembers /></ProtectedRoute>} />
          <Route path="/gym-admin/staff" element={<ProtectedRoute allowedRoles={GYM_ADMIN_ROLES}><GymAdminStaff /></ProtectedRoute>} />
          <Route path="/gym-admin/subscriptions" element={<ProtectedRoute allowedRoles={GYM_ADMIN_ROLES}><GymAdminSubscriptions /></ProtectedRoute>} />
          <Route path="/gym-admin/billing" element={<ProtectedRoute allowedRoles={GYM_ADMIN_ROLES}><GymAdminBilling /></ProtectedRoute>} />
          <Route path="/gym-admin/attendance" element={<ProtectedRoute allowedRoles={GYM_ADMIN_ROLES}><GymAdminAttendance /></ProtectedRoute>} />
          <Route path="/gym-admin/scheduling" element={<ProtectedRoute allowedRoles={GYM_ADMIN_ROLES}><GymAdminScheduling /></ProtectedRoute>} />
          <Route path="/gym-admin/leads" element={<ProtectedRoute allowedRoles={GYM_ADMIN_ROLES}><GymAdminLeads /></ProtectedRoute>} />
          <Route path="/gym-admin/communications" element={<ProtectedRoute allowedRoles={GYM_ADMIN_ROLES}><GymAdminCommunications /></ProtectedRoute>} />
          <Route path="/gym-admin/inventory" element={<ProtectedRoute allowedRoles={GYM_ADMIN_ROLES}><GymAdminInventory /></ProtectedRoute>} />
          <Route path="/gym-admin/equipment" element={<ProtectedRoute allowedRoles={GYM_ADMIN_ROLES}><GymAdminEquipment /></ProtectedRoute>} />
          <Route path="/gym-admin/settings" element={<ProtectedRoute allowedRoles={GYM_ADMIN_ROLES}><GymAdminSettings /></ProtectedRoute>} />
          <Route path="/gym-admin/revenue" element={<ProtectedRoute allowedRoles={GYM_ADMIN_ROLES}><GymAdminRevenue /></ProtectedRoute>} />
          <Route path="/gym-manager/dashboard" element={<ProtectedRoute allowedRoles={GYM_MANAGER_ROLES}><GymManagerDashboard /></ProtectedRoute>} />
          <Route path="/reports" element={<Reports />} />
          <Route path="*" element={<Navigate to={getDashboardPath(user.role)} replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<PublicOnlyRoute><LandingPage /></PublicOnlyRoute>} />
      <Route path="/login" element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
      <Route path="/unauthorized" element={<Unauthorized />} />
      <Route path="/*" element={<ProtectedRoute allowedRoles={APP_ROLES}><Shell /></ProtectedRoute>} />
    </Routes>
  );
}
