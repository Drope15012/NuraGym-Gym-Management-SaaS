import { useEffect, useState } from 'react';
import { api } from '../services/api';

export default function PlatformDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard/platform')
      .then((response) => setAnalytics(response.data))
      .catch((requestError) => setError(getErrorMessage(requestError, 'Could not load platform analytics.')))
      .finally(() => setIsLoading(false));
  }, []);

  const metrics = analytics?.metrics || {};

  return (
    <div className="workflow-page">
      <header className="page-header"><div><span>Super Admin</span><h1>Platform dashboard</h1></div></header>
      {error && <div className="form-error" role="alert">{error}</div>}
      {isLoading && <div className="dashboard-box">Loading platform analytics...</div>}
      <section className="metric-grid">
        <Metric label="Total System Revenue" value={formatCurrency(metrics.totalRevenue)} tone="orange" />
        <Metric label="Active Gym Tenants" value={metrics.activeGymTenants} tone="green" />
        <Metric label="Total Platform Users" value={metrics.totalPlatformUsers} tone="purple" />
        <Metric label="System Health" value={metrics.systemHealth || 'Unavailable'} tone="teal" />
      </section>
      <section className="panel"><h2>Platform status</h2><div className="summary-list"><div className="summary-row"><span>API service</span><strong>{metrics.systemHealth || 'Unavailable'}</strong></div><div className="summary-row"><span>Registered tenants</span><strong>{metrics.totalGymTenants || 0}</strong></div><div className="summary-row"><span>Paid transactions</span><strong>{metrics.paidTransactions || 0}</strong></div></div></section>
    </div>
  );
}

function Metric({ label, value, tone }) { return <article className={`dashboard-metric metric-${tone}`}><span>{label}</span><strong>{value ?? 'Unavailable'}</strong></article>; }
function formatCurrency(value) { return `₹${Number(value || 0).toLocaleString('en-IN')}`; }
function getErrorMessage(error, fallback) { return error.response?.data?.message || (error.request ? 'The API did not respond. Check that the backend is running.' : fallback); }
