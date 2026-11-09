import { useEffect, useState } from 'react';
import { api } from '../services/api';

export default function Financials() {
  const [dashboard, setDashboard] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/dashboard')
      .then((response) => setDashboard(response.data))
      .catch((requestError) => setError(requestError.response?.data?.message || 'Could not load financial data.'));
  }, []);

  const metrics = dashboard?.metrics || {};
  const payments = dashboard?.recentPayments || [];

  return (
    <div className="workflow-page">
      <header className="page-header"><div><span>Gym administration</span><h1>Financials</h1></div></header>
      {error && <div className="form-error">{error}</div>}
      <section className="metric-grid"><article className="dashboard-metric metric-orange"><span>Sales</span><strong>{formatCurrency(metrics.sales)}</strong></article><article className="dashboard-metric metric-green"><span>Collected</span><strong>{formatCurrency(metrics.paymentsCollected)}</strong></article><article className="dashboard-metric metric-purple"><span>Pending</span><strong>{formatCurrency(metrics.paymentsPending)}</strong></article></section>
      <section className="panel"><h2>Recent transactions</h2><div className="table-wrap"><table><thead><tr><th>Member</th><th>Method</th><th>Status</th><th>Amount</th><th>Paid at</th></tr></thead><tbody>{payments.map((payment) => <tr key={payment._id}><td>{payment.member_name}</td><td>{payment.method}</td><td>{payment.status}</td><td>{formatCurrency(payment.amount)}</td><td>{formatDate(payment.paidAt)}</td></tr>)}{payments.length === 0 && <tr><td colSpan="5">No transactions recorded.</td></tr>}</tbody></table></div></section>
    </div>
  );
}

function formatCurrency(amount) { return `₹${Number(amount || 0).toLocaleString('en-IN')}`; }
function formatDate(value) { return value ? new Date(value).toLocaleString() : ''; }
