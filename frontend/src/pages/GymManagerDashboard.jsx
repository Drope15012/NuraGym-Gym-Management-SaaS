import { useEffect, useState } from 'react';
import { api } from '../services/api';

const planOptions = [
  { id: '1-month', label: '1 Month', durationMonths: 1, amount: 2499 },
  { id: '3-month', label: '3 Months', durationMonths: 3, amount: 6999 },
  { id: '6-month', label: '6 Months', durationMonths: 6, amount: 12999 }
];

const emptyPayment = {
  member: '',
  plan: '',
  amount: '',
  discount: '0',
  method: 'upi',
  reference: '',
  startDate: '',
  endDate: ''
};

const upcomingClasses = [
  { time: '08:30 AM', name: 'HIIT Burn', trainer: 'Ava' },
  { time: '12:15 PM', name: 'Strength Lab', trainer: 'Noah' },
  { time: '06:00 PM', name: 'Yoga Flow', trainer: 'Maya' }
];

const actionAlerts = [
  { name: 'Priya S.', status: 'Membership Expiring Today', tone: 'warning' },
  { name: 'Daniel T.', status: 'Pending Dues', tone: 'danger' },
  { name: 'Riya M.', status: 'Membership Expiring Today', tone: 'warning' }
];

export default function GymManagerDashboard() {
  const [search, setSearch] = useState('');
  const [members, setMembers] = useState([]);
  const [checkIns, setCheckIns] = useState([]);
  const [recentPayments, setRecentPayments] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [payment, setPayment] = useState(emptyPayment);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [collectedRevenue, setCollectedRevenue] = useState(0);
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [registeredUsers, setRegisteredUsers] = useState([]);
  const [leadForm, setLeadForm] = useState({ name: '', phone: '', email: '', interest: 'Personal Training' });
  const [memberForm, setMemberForm] = useState({ name: '', phone: '', email: '', interest: 'Strength Training' });
  const [addUserForm, setAddUserForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    emergencyContactName: '',
    emergencyPhone: '',
    plan: '1-month',
    startDate: formatSimpleDate(new Date())
  });

  useEffect(() => {
    loadOperations();
    loadMembers();
  }, []);

  useEffect(() => {
    const query = search.trim();
    if (!query) {
      setMembers([]);
      return undefined;
    }
    const timeout = setTimeout(() => searchMembers(query), 250);
    return () => clearTimeout(timeout);
  }, [search]);

  async function loadOperations() {
    setIsLoading(true);
    try {
      const [dashboardResponse, checkInsResponse, paymentsResponse] = await Promise.all([
        api.get('/dashboard'),
        api.get('/checkins/today'),
        api.get('/payments/recent')
      ]);
      setDashboard(dashboardResponse.data);
      setCheckIns(Array.isArray(checkInsResponse.data) ? checkInsResponse.data : []);
      setRecentPayments(Array.isArray(paymentsResponse.data) ? paymentsResponse.data : []);
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Could not load operations data.'));
    } finally {
      setIsLoading(false);
    }
  }

  async function loadMembers() {
    try {
      const response = await api.get('/members');
      const memberList = Array.isArray(response.data) ? response.data : [];
      setMembers(memberList);
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Could not load members.'));
    }
  }

  async function searchMembers(query) {
    try {
      const response = await api.get('/checkins/members', { params: { query } });
      setMembers(Array.isArray(response.data) ? response.data : []);
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Could not search members.'));
    }
  }

  async function checkIn(memberId) {
    setError('');
    setNotice('');
    try {
      await api.post('/checkins', { memberId });
      setSearch('');
      setMembers([]);
      setNotice('Member checked in successfully.');
      await loadOperations();
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Could not check in member.'));
    }
  }

  function handlePlanChange(nextPlanId) {
    const selectedPlan = planOptions.find((plan) => plan.id === nextPlanId);
    if (!selectedPlan) {
      setPayment((current) => ({ ...current, plan: '', amount: '', startDate: '', endDate: '' }));
      return;
    }

    const startDate = new Date();
    const endDate = addMonths(startDate, selectedPlan.durationMonths);

    setPayment((current) => ({
      ...current,
      plan: selectedPlan.id,
      amount: String(selectedPlan.amount),
      startDate: formatSimpleDate(startDate),
      endDate: formatSimpleDate(endDate)
    }));
  }

  async function collectPayment(event) {
    event.preventDefault();
    setError('');
    setNotice('');
    setIsSaving(true);
    try {
      const totalAfterDiscount = Math.max(0, Number(payment.amount || 0) - Number(payment.discount || 0));
      await api.post('/payments', {
        member: payment.member,
        amount: totalAfterDiscount,
        method: payment.method,
        status: 'paid',
        reference: payment.reference || undefined,
        plan: payment.plan || undefined,
        startDate: payment.startDate || undefined,
        endDate: payment.endDate || undefined
      });
      setCollectedRevenue((prev) => prev + Number(totalAfterDiscount || 0));
      setPayment({ ...emptyPayment, discount: '0' });
      setNotice('Payment collected successfully.');
      await loadOperations();
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Could not collect payment.'));
    } finally {
      setIsSaving(false);
    }
  }

  function handleLeadSubmit(event) {
    event.preventDefault();
    setIsLeadModalOpen(false);
    setLeadForm({ name: '', phone: '', email: '', interest: 'Personal Training' });
    setNotice(`Lead added for ${leadForm.name || 'new prospect'}.`);
  }

  function handleMemberSubmit(event) {
    event.preventDefault();
    setIsMemberModalOpen(false);
    setMemberForm({ name: '', phone: '', email: '', interest: 'Strength Training' });
    setNotice(`Member registered for ${memberForm.name || 'new guest'}.`);
  }

  async function handleAddUserSubmit(event) {
    event.preventDefault();
    const selectedPlan = planOptions.find((plan) => plan.id === addUserForm.plan) || planOptions[0];
    const initialMembershipPrice = Number(selectedPlan.amount || 0);

    const payload = {
      name: addUserForm.fullName,
      email: addUserForm.email,
      phone: addUserForm.phone,
      password: 'Welcome123!',
      plan: addUserForm.plan,
      startDate: addUserForm.startDate,
      emergencyContactName: addUserForm.emergencyContactName,
      emergencyPhone: addUserForm.emergencyPhone
    };

    console.log('Submitting member form payload:', payload);

    try {
      const token = localStorage.getItem('nuragym_token');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      console.log('Member POST response:', { status: response.status, data });

      if (!response.ok) {
        throw new Error(data?.message || 'Could not register user.');
      }

      const createdMember = data;
      setRegisteredUsers((current) => [{
        id: createdMember.id || createdMember._id || Date.now(),
        fullName: createdMember.name || addUserForm.fullName,
        phone: createdMember.phone || addUserForm.phone,
        plan: createdMember.plan || addUserForm.plan,
        startDate: createdMember.startDate || addUserForm.startDate
      }, ...current]);
      setCollectedRevenue((prev) => prev + initialMembershipPrice);
      setIsAddUserModalOpen(false);
      setAddUserForm({
        fullName: '',
        email: '',
        phone: '',
        dateOfBirth: '',
        emergencyContactName: '',
        emergencyPhone: '',
        plan: '1-month',
        startDate: formatSimpleDate(new Date())
      });
      alert('User successfully registered!');
    } catch (error) {
      console.error('Member registration failed:', error);
      setError(error.message || 'Could not register user.');
    }
  }

  const metrics = dashboard?.metrics || {};
  const discountedTotal = Math.max(0, Number(payment.amount || 0) - Number(payment.discount || 0));

  return (
    <div className="workflow-page" style={{ display: 'grid', gap: '1.25rem' }}>
      <header className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
        <div>
          <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#5b728a' }}>Gym Manager</span>
          <h1 style={{ margin: '0.2rem 0 0' }}>Daily operations</h1>
        </div>
        <button type="button" onClick={() => setIsAddUserModalOpen(true)} style={styles.primaryButton}>
          Register New User
        </button>
      </header>

      {error && <div className="form-error" role="alert" style={styles.alertError}>{error}</div>}
      {notice && <div className="form-notice" role="status" style={styles.alertSuccess}>{notice}</div>}

      <section className="metric-grid" style={styles.metricGrid}>
        <Metric label="Today's check-ins" value={checkIns.length} tone="teal" />
        <Metric label="Collected revenue" value={`₹${collectedRevenue}`} tone="green" />
        <Metric label="Pending revenue" value={formatCurrency(metrics.paymentsPending)} tone="purple" />
      </section>

      <section className="workflow-columns" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.25rem' }}>
        <section className="panel" style={styles.panel}>
          <h2>Member check-in</h2>
          <input type="search" value={search} placeholder="Search name, email, or phone" onChange={(event) => setSearch(event.target.value)} style={styles.input} />

          <div className="list" style={{ display: 'grid', gap: '0.75rem' }}>
            {members.map((member) => (
              <article className="list-row" key={member._id} style={styles.listRow}>
                <div>
                  <strong>{member.name}</strong>
                  <span style={{ display: 'block', color: '#5b728a' }}>{member.email}{member.phone ? ` · ${member.phone}` : ''}</span>
                </div>
                {member.checkedInToday ? <b>Checked in</b> : <button type="button" onClick={() => checkIn(member._id)}>Check in</button>}
              </article>
            ))}
            {search && members.length === 0 && <p className="empty-state">No matching members.</p>}
          </div>

          <h3 style={{ marginTop: '1rem' }}>Today&apos;s check-ins</h3>
          <div className="list" style={{ display: 'grid', gap: '0.75rem' }}>
            {checkIns.map((checkInRecord) => (
              <article className="list-row" key={checkInRecord._id} style={styles.listRow}>
                <div>
                  <strong>{checkInRecord.name}</strong>
                  <span style={{ display: 'block', color: '#5b728a' }}>{checkInRecord.email}</span>
                </div>
                <span>{formatDateTime(checkInRecord.checkedInAt)}</span>
              </article>
            ))}
            {!isLoading && checkIns.length === 0 && <p className="empty-state">No check-ins recorded.</p>}
          </div>
        </section>

        <section className="panel" style={styles.panel}>
          <h2>Point of Sale</h2>
          <form className="workflow-form" onSubmit={collectPayment} style={{ display: 'grid', gap: '0.8rem' }}>
            <select required value={payment.member} onChange={(event) => setPayment({ ...payment, member: event.target.value })} style={styles.input}>
              <option value="">Search and select a member</option>
              {members.map((member) => (
                <option key={member._id} value={member._id}>{member.name} · {member.email}</option>
              ))}
            </select>

            <select value={payment.plan} onChange={(event) => handlePlanChange(event.target.value)} style={styles.input}>
              <option value="">Select Plan</option>
              {planOptions.map((plan) => (
                <option key={plan.id} value={plan.id}>{plan.label}</option>
              ))}
            </select>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <label style={styles.label}>
                <span>Amount</span>
                <input
                  required
                  min="0.01"
                  step="0.01"
                  type="number"
                  value={payment.amount}
                  onChange={(event) => setPayment({ ...payment, amount: event.target.value })}
                  style={styles.input}
                />
              </label>

              <label style={styles.label}>
                <span>Discount</span>
                <input
                  min="0"
                  step="0.01"
                  type="number"
                  value={payment.discount}
                  onChange={(event) => setPayment({ ...payment, discount: event.target.value })}
                  style={styles.input}
                />
              </label>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <label style={styles.label}>
                <span>Start Date</span>
                <input value={payment.startDate || new Date().toISOString().slice(0, 10)} readOnly style={styles.input} />
              </label>

              <label style={styles.label}>
                <span>End Date</span>
                <input value={payment.endDate || ''} readOnly style={styles.input} />
              </label>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <select value={payment.method} onChange={(event) => setPayment({ ...payment, method: event.target.value })} style={styles.input}>
                <option value="upi">UPI</option>
                <option value="cash">Cash</option>
                <option value="card">Card</option>
              </select>

              <input value={payment.reference} placeholder="Reference" onChange={(event) => setPayment({ ...payment, reference: event.target.value })} style={styles.input} />
            </div>

            <div style={{ background: '#f8fafc', border: '1px solid #dfeaf5', borderRadius: '10px', padding: '0.75rem 0.9rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#465975' }}>
                <span>Due</span>
                <strong>{formatCurrency(payment.amount || 0)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#465975', marginTop: '0.4rem' }}>
                <span>Discount</span>
                <strong>{formatCurrency(payment.discount || 0)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', marginTop: '0.7rem' }}>
                <span>Total</span>
                <strong>{formatCurrency(discountedTotal)}</strong>
              </div>
            </div>

            <button type="submit" disabled={isSaving} style={styles.primaryButton}>
              {isSaving ? 'Saving...' : 'Collect payment'}
            </button>
          </form>
        </section>
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
        <section className="panel" style={styles.panel}>
          <h2>Quick Actions</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
            <button type="button" onClick={() => setIsLeadModalOpen(true)} style={styles.primaryButton}>Add New Lead</button>
            <button type="button" onClick={() => setIsMemberModalOpen(true)} style={styles.secondaryButton}>Register New Member</button>
          </div>
        </section>

        <section className="panel" style={styles.panel}>
          <h2>Action Required</h2>
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {actionAlerts.map((alertItem) => (
              <div key={alertItem.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', padding: '0.7rem 0.8rem', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e6edf5' }}>
                <div>
                  <strong>{alertItem.name}</strong>
                  <div style={{ color: '#5b728a', fontSize: '0.82rem' }}>{alertItem.status}</div>
                </div>
                <span style={{ ...styles.tag, background: alertItem.tone === 'danger' ? '#fee2e2' : '#fef3c7', color: alertItem.tone === 'danger' ? '#991b1b' : '#92400e' }}>
                  {alertItem.status}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="panel" style={styles.panel}>
          <h2>Today&apos;s Classes</h2>
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {upcomingClasses.map((session) => (
              <div key={`${session.time}-${session.name}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', padding: '0.7rem 0.8rem', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e6edf5' }}>
                <div>
                  <div style={{ fontWeight: 700 }}>{session.name}</div>
                  <div style={{ color: '#5b728a', fontSize: '0.8rem' }}>Trainer: {session.trainer}</div>
                </div>
                <span style={{ background: '#e0f2fe', color: '#075985', borderRadius: '999px', padding: '0.35rem 0.55rem', fontSize: '0.74rem', fontWeight: 700 }}>{session.time}</span>
              </div>
            ))}
          </div>
        </section>
      </section>

      <section className="panel" style={styles.panel}>
        <h2>Recently Registered Members</h2>
        <div className="table-wrap" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={styles.tableCell}>Name</th>
                <th style={styles.tableCell}>Phone</th>
                <th style={styles.tableCell}>Selected Plan</th>
                <th style={styles.tableCell}>Join Date</th>
              </tr>
            </thead>
            <tbody>
              {registeredUsers.length === 0 ? (
                <tr>
                  <td colSpan="4" style={styles.tableCell}>No new members registered today.</td>
                </tr>
              ) : (
                registeredUsers.map((user) => (
                  <tr key={user.id}>
                    <td style={styles.tableCell}>{user.fullName}</td>
                    <td style={styles.tableCell}>{user.phone}</td>
                    <td style={styles.tableCell}>{getPlanLabel(user.plan)}</td>
                    <td style={styles.tableCell}>{user.startDate}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel" style={styles.panel}>
        <h2>Recent payment logs</h2>
        <div className="table-wrap" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={styles.tableCell}>Member</th>
                <th style={styles.tableCell}>Method</th>
                <th style={styles.tableCell}>Status</th>
                <th style={styles.tableCell}>Amount</th>
                <th style={styles.tableCell}>Paid at</th>
              </tr>
            </thead>
            <tbody>
              {recentPayments.map((record) => (
                <tr key={record._id}>
                  <td style={styles.tableCell}>{record.member?.name || record.member_name || record.memberName}</td>
                  <td style={styles.tableCell}>{record.method}</td>
                  <td style={styles.tableCell}>{record.status}</td>
                  <td style={styles.tableCell}>{formatCurrency(record.amount)}</td>
                  <td style={styles.tableCell}>{formatDateTime(record.paidAt)}</td>
                </tr>
              ))}
              {!isLoading && recentPayments.length === 0 && (
                <tr>
                  <td colSpan="5" style={styles.tableCell}>No payment logs.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {isLeadModalOpen && (
        <ModalShell title="Add New Lead" onClose={() => setIsLeadModalOpen(false)}>
          <form onSubmit={handleLeadSubmit} style={{ display: 'grid', gap: '0.75rem' }}>
            <input value={leadForm.name} onChange={(event) => setLeadForm({ ...leadForm, name: event.target.value })} placeholder="Name" style={styles.input} />
            <input value={leadForm.phone} onChange={(event) => setLeadForm({ ...leadForm, phone: event.target.value })} placeholder="Phone" style={styles.input} />
            <input value={leadForm.email} onChange={(event) => setLeadForm({ ...leadForm, email: event.target.value })} placeholder="Email" style={styles.input} />
            <select value={leadForm.interest} onChange={(event) => setLeadForm({ ...leadForm, interest: event.target.value })} style={styles.input}>
              <option value="Personal Training">Personal Training</option>
              <option value="Strength Training">Strength Training</option>
              <option value="Yoga">Yoga</option>
              <option value="Group Classes">Group Classes</option>
            </select>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button type="button" onClick={() => setIsLeadModalOpen(false)} style={styles.secondaryButton}>Cancel</button>
              <button type="submit" style={styles.primaryButton}>Save Lead</button>
            </div>
          </form>
        </ModalShell>
      )}

      {isMemberModalOpen && (
        <ModalShell title="Register New Member" onClose={() => setIsMemberModalOpen(false)}>
          <form onSubmit={handleMemberSubmit} style={{ display: 'grid', gap: '0.75rem' }}>
            <input value={memberForm.name} onChange={(event) => setMemberForm({ ...memberForm, name: event.target.value })} placeholder="Name" style={styles.input} />
            <input value={memberForm.phone} onChange={(event) => setMemberForm({ ...memberForm, phone: event.target.value })} placeholder="Phone" style={styles.input} />
            <input value={memberForm.email} onChange={(event) => setMemberForm({ ...memberForm, email: event.target.value })} placeholder="Email" style={styles.input} />
            <select value={memberForm.interest} onChange={(event) => setMemberForm({ ...memberForm, interest: event.target.value })} style={styles.input}>
              <option value="Strength Training">Strength Training</option>
              <option value="Cardio">Cardio</option>
              <option value="Yoga">Yoga</option>
              <option value="CrossFit">CrossFit</option>
            </select>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button type="button" onClick={() => setIsMemberModalOpen(false)} style={styles.secondaryButton}>Cancel</button>
              <button type="submit" style={styles.primaryButton}>Register</button>
            </div>
          </form>
        </ModalShell>
      )}

      {isAddUserModalOpen && (
        <ModalShell title="Register New User" onClose={() => setIsAddUserModalOpen(false)}>
          <form onSubmit={handleAddUserSubmit} style={{ display: 'grid', gap: '0.75rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <input value={addUserForm.fullName} onChange={(event) => setAddUserForm({ ...addUserForm, fullName: event.target.value })} placeholder="Full Name" style={styles.input} />
              <input value={addUserForm.email} onChange={(event) => setAddUserForm({ ...addUserForm, email: event.target.value })} placeholder="Email" type="email" style={styles.input} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <input value={addUserForm.phone} onChange={(event) => setAddUserForm({ ...addUserForm, phone: event.target.value })} placeholder="Phone Number" style={styles.input} />
              <input value={addUserForm.dateOfBirth} onChange={(event) => setAddUserForm({ ...addUserForm, dateOfBirth: event.target.value })} placeholder="Date of Birth" type="date" style={styles.input} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <input value={addUserForm.emergencyContactName} onChange={(event) => setAddUserForm({ ...addUserForm, emergencyContactName: event.target.value })} placeholder="Emergency Contact Name" style={styles.input} />
              <input value={addUserForm.emergencyPhone} onChange={(event) => setAddUserForm({ ...addUserForm, emergencyPhone: event.target.value })} placeholder="Emergency Phone" style={styles.input} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <select value={addUserForm.plan} onChange={(event) => setAddUserForm({ ...addUserForm, plan: event.target.value })} style={styles.input}>
                {planOptions.map((plan) => (
                  <option key={plan.id} value={plan.id}>{plan.label}</option>
                ))}
              </select>
              <input
                value={addUserForm.startDate}
                readOnly
                placeholder="Start Date"
                style={styles.input}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button type="button" onClick={() => setIsAddUserModalOpen(false)} style={styles.secondaryButton}>Cancel</button>
              <button type="submit" style={styles.primaryButton}>Register User</button>
            </div>
          </form>
        </ModalShell>
      )}
    </div>
  );
}

function ModalShell({ title, children, onClose }) {
  return (
    <div style={styles.modalBackdrop} onClick={onClose}>
      <div style={styles.modalCard} onClick={(event) => event.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ margin: 0 }}>{title}</h3>
          <button type="button" onClick={onClose} aria-label="Close" style={styles.closeButton}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Metric({ label, value, tone }) { return <article className={`dashboard-metric metric-${tone}`} style={styles.metricCard}><span>{label}</span><strong>{value}</strong></article>; }
function formatCurrency(value) { return `₹${Number(value || 0).toLocaleString('en-IN')}`; }
function formatDateTime(value) { return value ? new Date(value).toLocaleString() : ''; }
function getErrorMessage(error, fallback) { return error.response?.data?.message || fallback; }
function getPlanLabel(planId) {
  const selectedPlan = planOptions.find((plan) => plan.id === planId);
  return selectedPlan ? selectedPlan.label : planId || '—';
}
function addMonths(date, months) {
  const clone = new Date(date);
  clone.setMonth(clone.getMonth() + months);
  return clone;
}
function formatSimpleDate(date) {
  const cloned = new Date(date);
  const year = cloned.getFullYear();
  const month = String(cloned.getMonth() + 1).padStart(2, '0');
  const day = String(cloned.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const styles = {
  panel: {
    background: '#fff',
    border: '1px solid #e5edf7',
    borderRadius: '16px',
    padding: '1rem 1rem 1.1rem',
    boxShadow: '0 10px 30px rgba(17, 24, 39, 0.03)'
  },
  metricGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '1rem'
  },
  metricCard: {
    background: 'linear-gradient(135deg, #f8fbff, #eef6ff)',
    border: '1px solid #dfeaf5',
    borderRadius: '14px',
    padding: '1rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.35rem'
  },
  listRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: '#f8fafc',
    border: '1px solid #e6edf5',
    borderRadius: '10px',
    padding: '0.8rem 0.9rem'
  },
  input: {
    width: '100%',
    border: '1px solid #dfeaf5',
    borderRadius: '10px',
    padding: '0.72rem 0.8rem',
    fontSize: '0.95rem',
    background: '#fff'
  },
  label: {
    display: 'grid',
    gap: '0.38rem',
    fontSize: '0.82rem',
    color: '#465975'
  },
  primaryButton: {
    border: 'none',
    borderRadius: '10px',
    background: '#1d4ed8',
    color: '#fff',
    padding: '0.72rem 1rem',
    fontWeight: 700,
    cursor: 'pointer'
  },
  secondaryButton: {
    border: '1px solid #dfeaf5',
    borderRadius: '10px',
    background: '#fff',
    color: '#1f2937',
    padding: '0.72rem 1rem',
    fontWeight: 600,
    cursor: 'pointer'
  },
  tag: {
    borderRadius: '999px',
    fontSize: '0.68rem',
    fontWeight: 700,
    padding: '0.28rem 0.55rem',
    whiteSpace: 'nowrap'
  },
  modalBackdrop: {
    position: 'fixed',
    inset: 0,
    display: 'grid',
    placeItems: 'center',
    background: 'rgba(15, 23, 42, 0.45)',
    zIndex: 40
  },
  modalCard: {
    width: 'min(32rem, calc(100vw - 2rem))',
    background: '#fff',
    borderRadius: '16px',
    padding: '1rem 1.1rem',
    boxShadow: '0 20px 45px rgba(15, 23, 42, 0.15)'
  },
  closeButton: {
    border: 'none',
    background: 'transparent',
    fontSize: '1.5rem',
    cursor: 'pointer',
    color: '#475569'
  },
  tableCell: {
    borderBottom: '1px solid #edf2f7',
    padding: '0.7rem 0.6rem',
    textAlign: 'left'
  },
  alertError: {
    background: '#fee2e2',
    color: '#991b1b',
    border: '1px solid #fecaca',
    borderRadius: '10px',
    padding: '0.8rem 0.9rem'
  },
  alertSuccess: {
    background: '#dcfce7',
    color: '#166534',
    border: '1px solid #bbf7d0',
    borderRadius: '10px',
    padding: '0.8rem 0.9rem'
  }
};
