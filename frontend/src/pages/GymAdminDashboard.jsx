import { useEffect, useState } from 'react';
import { api } from '../services/api';

const emptyStaffForm = {
  name: '',
  email: '',
  phone: '',
  password: '',
  role: 'gym_manager'
};

export default function GymAdminDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [payments, setPayments] = useState([]);
  const [staff, setStaff] = useState([]);
  const [staffForm, setStaffForm] = useState(emptyStaffForm);
  const [collectedRevenue, setCollectedRevenue] = useState(0);
  const [pendingRevenue, setPendingRevenue] = useState(0);
  const [sales, setSales] = useState(0);
  const [activeMembers, setActiveMembers] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [createdCredentials, setCreatedCredentials] = useState(null);

  useEffect(() => {
    loadAdminData();
    loadDashboardStats();
  }, []);

  async function loadDashboardStats() {
    try {
      const token = localStorage.getItem('nuragym_token');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/dashboard/stats`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });

      const data = await response.json();
      console.log('Dashboard stats response:', data);

      if (response.ok) {
        setCollectedRevenue(Number(data.collectedRevenue || data.totalRevenue || 0));
        setActiveMembers(Number(data.activeMembers || data.totalMembers || 0));
      }
    } catch (requestError) {
      console.error('Dashboard stats fetch failed:', requestError);
    }
  }

  async function loadAdminData() {
    setIsLoading(true);
    setError('');
    try {
      const [dashboardResponse, paymentsResponse, usersResponse, membersResponse] = await Promise.all([
        api.get('/dashboard'),
        api.get('/payments'),
        api.get('/users'),
        api.get('/members')
      ]);

      const dashboardData = dashboardResponse.data || {};
      const paymentList = Array.isArray(paymentsResponse.data) ? paymentsResponse.data : [];
      const memberList = Array.isArray(membersResponse.data) ? membersResponse.data : [];
      const userList = Array.isArray(usersResponse.data) ? usersResponse.data : [];
      const dashboardMetrics = dashboardData.metrics || {};

      const totalSales = Number(
        dashboardMetrics.sales ??
        paymentList.reduce((sum, payment) => sum + Number(payment.amount || 0), 0)
      );
      const totalCollected = Number(
        dashboardMetrics.paymentsCollected ??
        paymentList
          .filter((payment) => String(payment.status).toLowerCase() === 'paid')
          .reduce((sum, payment) => sum + Number(payment.amount || 0), 0)
      );
      const totalPending = Number(
        dashboardMetrics.paymentsPending ??
        paymentList
          .filter((payment) => String(payment.status).toLowerCase() === 'pending')
          .reduce((sum, payment) => sum + Number(payment.amount || 0), 0)
      );
      const activeMemberCount = Number(
        dashboardData.members?.active ??
        memberList.filter((member) => member.isActive === true || member.is_active === true || member.status === 'active').length ??
        0
      );

      setDashboard(dashboardData);
      setPayments(paymentList);
      setStaff(userList.filter((user) => user.role === 'gym_manager' || user.role === 'trainer'));
      setSales(totalSales);
      setCollectedRevenue(totalCollected);
      setPendingRevenue(totalPending);
      setActiveMembers(activeMemberCount);
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Could not load gym administration data.'));
    } finally {
      setIsLoading(false);
    }
  }

  async function createStaff(event) {
    event.preventDefault();
    setIsSaving(true);
    setError('');
    setNotice('');
    try {
      const response = await api.post('/users', staffForm);
      setCreatedCredentials({
        role: staffForm.role === 'trainer' ? 'Trainer' : 'Gym Manager',
        slug: response.data.gymSlug,
        email: response.data.email,
        password: staffForm.password
      });
      setStaffForm(emptyStaffForm);
      setNotice('Staff account created successfully.');
      await loadAdminData();
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Could not create staff account.'));
    } finally {
      setIsSaving(false);
    }
  }

  const leaderboard = buildLeaderboard(payments);

  return (
    <div className="workflow-page">
      <header className="page-header"><div><span>Gym Admin</span><h1>Gym administration</h1></div></header>
      {error && <div className="form-error" role="alert">{error}</div>}
      {notice && <div className="form-notice" role="status">{notice}</div>}
      {createdCredentials && <div className="credential-panel" role="status"><strong>Save these login details now. The password will not be shown again.</strong><span>Role: {createdCredentials.role}</span><span>Gym slug: {createdCredentials.slug}</span><span>Email: {createdCredentials.email}</span><span>Password: {createdCredentials.password}</span><button type="button" onClick={() => setCreatedCredentials(null)}>Hide credentials</button></div>}

      <section className="metric-grid">
        <Metric label="Sales" value={formatCurrency(sales)} tone="orange" />
        <Metric label="Collected" value={formatCurrency(collectedRevenue)} tone="green" />
        <Metric label="Pending" value={formatCurrency(pendingRevenue)} tone="purple" />
        <Metric label="Active members" value={activeMembers} tone="teal" />
      </section>

      <section className="workflow-columns">
        <section className="panel">
          <h2>Create staff account</h2>
          <form className="workflow-form" onSubmit={createStaff}>
            <input required value={staffForm.name} placeholder="Full name" onChange={(event) => setStaffForm({ ...staffForm, name: event.target.value })} />
            <input required type="email" value={staffForm.email} placeholder="Email" onChange={(event) => setStaffForm({ ...staffForm, email: event.target.value })} />
            <input value={staffForm.phone} placeholder="Phone" onChange={(event) => setStaffForm({ ...staffForm, phone: event.target.value })} />
            <input required minLength="8" type="password" value={staffForm.password} placeholder="Temporary password" onChange={(event) => setStaffForm({ ...staffForm, password: event.target.value })} />
            <select value={staffForm.role} onChange={(event) => setStaffForm({ ...staffForm, role: event.target.value })}><option value="gym_manager">Gym Manager</option><option value="trainer">Trainer</option></select>
            <button type="submit" disabled={isSaving}>{isSaving ? 'Creating...' : 'Create staff account'}</button>
          </form>
        </section>

        <section className="panel">
          <h2>Current staff</h2>
          {staff.length === 0 && <p className="empty-state">No Gym Managers or Trainers found.</p>}
          <div className="list">{staff.map((user) => <article className="list-row" key={user._id}><div><strong>{user.name}</strong><span>{user.email}</span></div><b>{user.role.replace('_', ' ')}</b></article>)}</div>
        </section>
      </section>

      <section className="panel">
        <div className="section-heading"><h2>Revenue leaderboard</h2>{isLoading && <span>Loading...</span>}</div>
        {leaderboard.length === 0 && <p className="empty-state">No paid transactions are available.</p>}
        <div className="list">{leaderboard.map((entry) => <article className="list-row" key={entry.memberId}><div><strong>{entry.name}</strong><span>{entry.transactions} paid transactions</span></div><b>{formatCurrency(entry.total)}</b></article>)}</div>
      </section>
    </div>
  );
}

function Metric({ label, value, tone }) {
  return <article className={`dashboard-metric metric-${tone}`}><span>{label}</span><strong>{value}</strong></article>;
}

function buildLeaderboard(payments) {
  const totals = new Map();
  payments.filter((payment) => payment.status === 'paid').forEach((payment) => {
    const memberId = payment.memberId || payment.member?._id || payment.member?.email || payment._id;
    const current = totals.get(memberId) || { memberId, name: payment.member?.name || payment.memberName || 'Member', total: 0, transactions: 0 };
    current.total += Number(payment.amount || 0);
    current.transactions += 1;
    totals.set(memberId, current);
  });
  return [...totals.values()].sort((first, second) => second.total - first.total);
}

function formatCurrency(value) { return `₹${Number(value || 0).toLocaleString('en-IN')}`; }
function getErrorMessage(error, fallback) { return error.response?.data?.message || fallback; }
