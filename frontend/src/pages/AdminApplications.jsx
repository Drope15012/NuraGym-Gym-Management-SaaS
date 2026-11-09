import { useEffect, useState } from 'react';
import { Check, RefreshCw, X } from 'lucide-react';
import { api } from '../services/api';

export default function AdminApplications() {
  const [applications, setApplications] = useState([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  async function loadApplications() {
    setError('');
    try {
      const response = await api.get('/applications/');
      setApplications(response.data);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not load gym applications.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadApplications();
  }, []);

  return (
    <div className="workflow-page">
      <header className="page-header">
        <div><span>Super Admin</span><h1>Gym applications</h1></div>
        <button type="button" onClick={loadApplications} aria-label="Refresh applications"><RefreshCw size={16} /> Refresh</button>
      </header>
      {error && <div className="form-error" role="alert">{error}</div>}
      <section className="panel applications-panel">
        <div className="applications-heading"><div><h2>Join requests</h2><p>Review gyms requesting access to NuraGym.</p></div><span>{applications.length} TOTAL</span></div>
        {isLoading ? <p className="empty-state">Loading applications…</p> : applications.length === 0 ? (
          <p className="empty-state">No gym applications have been submitted yet.</p>
        ) : (
          <div className="table-wrap">
            <table className="applications-table">
              <thead><tr><th>Gym</th><th>Owner</th><th>Contact</th><th>Location</th><th>Applied</th><th>Status</th><th>Review</th></tr></thead>
              <tbody>{applications.map((application) => (
                <tr key={application.applicationId}>
                  <td><strong>{application.gymName}</strong></td>
                  <td>{application.ownerName}</td>
                  <td><a href={`mailto:${application.email}`}>{application.email}</a><span>{application.phone}</span></td>
                  <td>{application.location}</td>
                  <td>{formatDate(application.appliedAt)}</td>
                  <td><span className={`application-status status-${application.status.toLowerCase()}`}>{application.status}</span></td>
                  <td><div className="application-actions">
                    <button className="approve-placeholder" type="button" disabled title="Approval action is not connected yet" aria-label={`Approve ${application.gymName}`}><Check size={15} /></button>
                    <button className="reject-placeholder" type="button" disabled title="Rejection action is not connected yet" aria-label={`Reject ${application.gymName}`}><X size={15} /></button>
                  </div></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function formatDate(value) {
  if (!value) return '—';
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(value));
}