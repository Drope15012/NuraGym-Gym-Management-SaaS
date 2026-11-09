import { useEffect, useState } from 'react';
import { api } from '../services/api';

const initialForm = { name: '', email: '', phone: '', password: '', role: 'gym_manager' };

export default function StaffCreator() {
  const [form, setForm] = useState(initialForm);
  const [staff, setStaff] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  async function loadStaff() {
    try {
      const response = await api.get('/users');
      setStaff(response.data.filter((user) => ['gym_manager', 'trainer'].includes(user.role)));
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not load staff.');
    }
  }

  useEffect(() => { loadStaff(); }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage('');
    setError('');
    setIsSaving(true);
    try {
      await api.post('/users', form);
      setForm(initialForm);
      setMessage(`${form.role === 'trainer' ? 'Trainer' : 'Gym Manager'} created.`);
      await loadStaff();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not create staff account.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="workflow-page">
      <header className="page-header"><div><span>Gym administration</span><h1>Staff creator</h1></div></header>
      {message && <div className="form-notice">{message}</div>}
      {error && <div className="form-error">{error}</div>}
      <form className="workflow-form" onSubmit={handleSubmit}>
        <fieldset><legend>Staff account</legend>
          <input required placeholder="Full name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
          <input required type="email" placeholder="Email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
          <input placeholder="Phone" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
          <input required minLength="8" type="password" placeholder="Temporary password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />
          <select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })}><option value="gym_manager">Gym Manager</option><option value="trainer">Trainer</option></select>
        </fieldset>
        <button type="submit" disabled={isSaving}>{isSaving ? 'Creating...' : 'Create staff account'}</button>
      </form>
      <section className="panel"><h2>Current staff</h2><div className="list">{staff.map((user) => <article className="list-row" key={user._id}><div><strong>{user.name}</strong><span>{user.email}</span></div><b>{user.role.replace('_', ' ')}</b></article>)}{staff.length === 0 && <p className="empty-state">No managers or trainers have been added.</p>}</div></section>
    </div>
  );
}
