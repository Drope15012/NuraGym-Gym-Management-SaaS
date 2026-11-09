import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';

export default function Dashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    api.get('/dashboard')
      .then((response) => { if (active) setDashboard(response.data); })
      .catch((requestError) => { if (active) setError(requestError.response?.data?.message || 'Could not load dashboard data.'); })
      .finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, []);

  const metrics = dashboard?.metrics || {};
  const members = dashboard?.members || {};
  const classes = dashboard?.classes || {};
  const memberships = dashboard?.memberships || {};
  const recentPayments = dashboard?.recentPayments || [];
  const dataGrids = [
    { title: 'Enquiries', values: [['Open', members.total || 0], ['Converted', members.active || 0], ['Lost', members.inactive || 0]] },
    { title: 'Total Clients', values: [['Active', members.active || 0], ['Inactive', members.inactive || 0]] },
    { title: 'Trials', values: [['Scheduled', classes.scheduled || 0], ['Completed', classes.completed || 0], ['Not-Attended', 'N/A']] },
    { title: 'Member Support Requests', values: [['Raised', 'N/A'], ['Closed', 'N/A'], ['Open', 'N/A']] }
  ];
  const summaryItems = [
    ['Follow-ups', 'N/A'], ['Appointments', 'N/A'], ['Classes', classes.total || 0],
    ['Service Expiry', memberships.expiring || 0], ['PT Expiry', 'N/A'], ['Upgrades', 'N/A'],
    ['Client Birthdays', 'N/A'], ['Staff Birthdays', 'N/A']
  ];
  const primaryMetrics = [
    { label: 'Sales', value: formatCurrency(metrics.sales), tone: 'orange', to: '/financials' },
    { label: 'Payments Collected', value: formatCurrency(metrics.paymentsCollected), tone: 'green', to: '/financials' },
    { label: 'Payments Pending', value: formatCurrency(metrics.paymentsPending), tone: 'purple', to: '/financials' }
  ];
  const activityMetrics = [
    { label: 'New Client(s)', value: members.active || 0, to: '/staff' },
    { label: 'Renewals', value: metrics.renewals || 0, to: '/financials' },
    { label: 'Check-ins', value: metrics.checkIns || 0, to: '/operations' }
  ];

  return (
    <div className="dashboard-page">
      <header className="dashboard-header"><div><p className="eyebrow">Operations / Overview</p><h1>Dashboard</h1></div><div className="dashboard-context">LIVE TENANT DATA <span>●</span></div></header>
      {error && <div className="form-error" role="alert">{error}</div>}
      <div className="dashboard-layout">
        <main className="dashboard-main" aria-busy={isLoading}>
          {isLoading && <div className="dashboard-box">Loading live dashboard data...</div>}
          {!isLoading && !dashboard && <div className="dashboard-box">No dashboard data available.</div>}
          <section className="metric-grid" aria-label="Financial metrics">{primaryMetrics.map((metric) => <MetricCard key={metric.label} {...metric} isLoading={isLoading} />)}</section>
          <section className="metric-grid" aria-label="Activity metrics">{activityMetrics.map((metric) => <MetricCard key={metric.label} {...metric} isLoading={isLoading} />)}</section>
          <section className="data-grid" aria-label="Operational metrics">{dataGrids.map((grid) => <DataGrid key={grid.title} {...grid} />)}</section>
        </main>
        <aside className="dashboard-sidebar">
          <section className="dashboard-box summary-box"><BoxHeader title="Summary" /><div className="summary-list">{summaryItems.map(([label, value]) => <div className="summary-row" key={label}><span>{label}</span><strong>{value}</strong></div>)}</div></section>
          <section className="dashboard-box payment-box"><BoxHeader title="Payment Collected" /><table><thead><tr><th>S.No</th><th>Pay Mode</th><th className="number-cell">Amount</th></tr></thead><tbody>{recentPayments.map((payment, index) => <tr key={payment._id || index}><td>{index + 1}</td><td>{formatPaymentMethod(payment.method)}</td><td className="number-cell">{formatCurrency(payment.amount)}</td></tr>)}{!isLoading && recentPayments.length === 0 && <tr><td colSpan="3">No payments recorded.</td></tr>}</tbody><tfoot><tr><th colSpan="2">Total</th><th className="number-cell">{formatCurrency(metrics.paymentsCollected)}</th></tr></tfoot></table></section>
          <section className="dashboard-box advance-box"><BoxHeader title="Revenue Status" /><div className="advance-values"><div><span>Collected</span><strong>{formatCurrency(metrics.paymentsCollected)}</strong></div><div><span>Pending</span><strong>{formatCurrency(metrics.paymentsPending)}</strong></div></div></section>
        </aside>
      </div>
    </div>
  );
}

function MetricCard({ label, value, tone = 'teal', to, isLoading }) {
  return <article className={`dashboard-metric metric-${tone}`}><span>{label}</span><strong>{isLoading ? '...' : value}</strong><Link to={to}>View more</Link></article>;
}

function DataGrid({ title, values }) {
  return <section className="dashboard-box data-box"><BoxHeader title={title} /><div className="data-values">{values.map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}</strong></div>)}</div></section>;
}

function BoxHeader({ title }) {
  return <header className="box-header"><h2>{title}</h2></header>;
}

function formatCurrency(amount) {
  return `₹${Number(amount || 0).toLocaleString('en-IN')}`;
}

function formatPaymentMethod(method) {
  return { upi: 'UPI', cash: 'Cash', card: 'Card', bank_transfer: 'Bank Transfer' }[method] || method || 'Unknown';
}
