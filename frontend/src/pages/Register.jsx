import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    gymName: '',
    slug: '',
    email: '',
    phone: '',
    name: '',
    password: ''
  });
  const [error, setError] = useState('');

  async function submit(event) {
    event.preventDefault();
    setError('');
    try {
      const { data } = await api.post('/onboarding', {
        gymName: form.gymName,
        slug: form.slug,
        gymEmail: form.email,
        gymPhone: form.phone,
        ownerName: form.name,
        ownerEmail: form.email,
        ownerPhone: form.phone,
        password: form.password,
        address: { line1: 'Main branch', city: 'Mumbai', state: 'Maharashtra', country: 'India' }
      });
      localStorage.setItem('nuragym_token', data.token);
      localStorage.setItem('nuragym_user', JSON.stringify(data.user));
      localStorage.setItem('nuragym_role', data.user.role);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    }
  }

  return (
    <div className="auth-page">
      <form className="auth-panel" onSubmit={submit}>
        <h1>Create NuraGym</h1>
        <input placeholder="Gym name" value={form.gymName} onChange={(e) => setForm({ ...form, gymName: e.target.value })} />
        <input placeholder="Gym slug" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
        <input placeholder="Owner name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input placeholder="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <input placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <input placeholder="Password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        {error && <div className="form-error">{error}</div>}
        <button type="submit">Create workspace</button>
        <Link to="/login">Already have an account?</Link>
      </form>
    </div>
  );
}
