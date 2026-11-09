import { useEffect, useState } from 'react';
import { api } from '../services/api';

const initialPayment = { member: '', amount: '', method: 'upi', reference: '' };

export default function ManagerOperations() {
  const [query, setQuery] = useState('');
  const [members, setMembers] = useState([]);
  const [todayCheckIns, setTodayCheckIns] = useState([]);
  const [payment, setPayment] = useState(initialPayment);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  async function loadCheckIns() {
    const response = await api.get('/checkins/today');
    setTodayCheckIns(response.data);
  }

  useEffect(() => {
    loadCheckIns().catch((requestError) => setError(requestError.response?.data?.message || 'Could not load check-ins.'));
  }, []);

  useEffect(() => {
    const timeout = setTimeout(async () => {
      if (!query.trim()) {
        setMembers([]);
        return;
      }
      try {
        const response = await api.get('/checkins/members', { params: { query } });
        setMembers(response.data);
      } catch (requestError) {
        setError(requestError.response?.data?.message || 'Could not search members.');
      }
    }, 250);
    return () => clearTimeout(timeout);
  }, [query]);

  async function checkIn(memberId) {
    setError('');
    try {
      await api.post('/checkins', { memberId });
      setMessage('Member checked in.');
      setQuery('');
      setMembers([]);
      await loadCheckIns();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not check in member.');
    }
  }

  async function collectPayment(event) {
    event.preventDefault();
    setError('');
    setIsSaving(true);
    try {
      await api.post('/payments', {
        member: payment.member,
        amount: Number(payment.amount),
        method: payment.method,
        status: 'paid',
        reference: payment.reference || undefined
      });
      setPayment(initialPayment);
      setMessage('Payment collected and revenue updated.');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not collect payment.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="workflow-page">
      <header className="page-header"><div><span>Daily operations</span><h1>Check-in & POS</h1></div></header>
      {message && <div className="form-notice">{message}</div>}
      {error && <div className="form-error">{error}</div>}
      <div className="workflow-columns">
        <section className="panel"><h2>Member check-in</h2><input placeholder="Search by name, email, or phone" value={query} onChange={(event) => setQuery(event.target.value)} /><div className="list search-results">{members.map((member) => <article className="list-row" key={member._id}><div><strong>{member.name}</strong><span>{member.email} {member.phone ? `· ${member.phone}` : ''}</span></div>{member.checkedInToday ? <b>Checked in</b> : <button type="button" onClick={() => checkIn(member._id)}>Check in</button>}</article>)}</div><h3>Today: {todayCheckIns.length}</h3><div className="list">{todayCheckIns.map((item) => <article className="list-row" key={item._id}><div><strong>{item.name}</strong><span>{item.email}</span></div><span>{formatTime(item.checkedInAt)}</span></article>)}{todayCheckIns.length === 0 && <p className="empty-state">No check-ins recorded today.</p>}</div></section>
        <section className="panel"><h2>Collect payment</h2><form className="workflow-form" onSubmit={collectPayment}><select required value={payment.member} onChange={(event) => setPayment({ ...payment, member: event.target.value })}><option value="">Select member</option>{members.map((member) => <option key={member._id} value={member._id}>{member.name} · {member.email}</option>)}</select><input required min="0.01" step="0.01" type="number" placeholder="Amount" value={payment.amount} onChange={(event) => setPayment({ ...payment, amount: event.target.value })} /><select value={payment.method} onChange={(event) => setPayment({ ...payment, method: event.target.value })}><option value="upi">UPI</option><option value="cash">Cash</option><option value="card">Card</option></select><input placeholder="Reference (optional)" value={payment.reference} onChange={(event) => setPayment({ ...payment, reference: event.target.value })} /><button type="submit" disabled={isSaving}>{isSaving ? 'Saving...' : 'Record paid transaction'}</button></form><p className="empty-state">Search for a member above before collecting payment.</p></section>
      </div>
    </div>
  );
}

function formatTime(value) {
  return value ? new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
}
