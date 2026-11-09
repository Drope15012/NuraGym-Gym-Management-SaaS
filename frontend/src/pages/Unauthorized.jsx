import { useNavigate } from 'react-router-dom';
import { logout } from '../services/auth';

export default function Unauthorized() {
  const navigate = useNavigate();

  function handleSignOut() {
    logout();
    navigate('/', { replace: true });
  }

  return (
    <main className="auth-page">
      <section className="auth-panel" aria-labelledby="unauthorized-title">
        <h1 id="unauthorized-title">Access unavailable</h1>
        <p>This account does not have access to a dashboard in this workspace.</p>
        <button type="button" onClick={handleSignOut}>Sign out</button>
      </section>
    </main>
  );
}