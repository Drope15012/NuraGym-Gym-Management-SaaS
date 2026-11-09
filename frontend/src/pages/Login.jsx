import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDashboardPath, login } from '../services/auth';

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ gym: 'admin', email: '', password: '' });
  const [error, setError] = useState('');

  async function handleLogin(event) {
    event.preventDefault();
    setError('');
    try {
      const data = await login({ ...form, gym: form.gym.trim().toLowerCase(), email: form.email.trim().toLowerCase() });
      navigate(getDashboardPath(data.user.role), { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || (err.request ? 'The server did not respond. Check that the backend is running.' : 'Login failed.'));
    }
  }

  return (
    <div className="auth-page">
      <form className="auth-panel" onSubmit={handleLogin}>
        <h1>NuraGym</h1>
        <p>Sign in to manage members, classes, and payments.</p>
        <input placeholder="Gym slug or ID" value={form.gym} onChange={(e) => setForm({ ...form, gym: e.target.value })} />
        <input required type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <input placeholder="Password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        {error && <div className="form-error" role="alert">{error}</div>}
        <button type="submit">Sign in</button>
      </form>
    </div>
  );
}
