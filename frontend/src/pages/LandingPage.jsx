import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, ArrowDown, ArrowUpRight, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';

const initialForm = {
  gymName: '',
  ownerName: '',
  email: '',
  phone: '',
  location: ''
};

export default function LandingPage() {
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage('');
    setError('');
    setIsSubmitting(true);

    try {
      await api.post('/applications/apply', form);
      setForm(initialForm);
      setMessage('Your application is in. Our team will be in touch soon.');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'We could not submit your application. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  return (
    <main className="landing-page">
      <nav className="landing-nav" aria-label="Main navigation">
        <a className="landing-brand" href="#top"><Activity size={22} aria-hidden="true" /><span>NuraGym</span></a>
        <div className="landing-nav-actions">
          <Link to="/login">Member login <ArrowUpRight size={15} aria-hidden="true" /></Link>
          <a className="landing-nav-apply" href="#apply">Apply to join</a>
        </div>
      </nav>

      <section className="landing-hero" id="top">
        <div className="landing-hero-copy">
          <p className="landing-kicker"><span /> One platform. Stronger gyms.</p>
          <h1>Make room for <em>better</em> business.</h1>
          <p className="landing-intro">NuraGym brings memberships, classes, payments, and people into one clear view, so you can spend less time managing and more time building your community.</p>
          <a className="landing-primary-link" href="#apply">Bring your gym to NuraGym <ArrowDown size={16} aria-hidden="true" /></a>
          <div className="landing-proof"><CheckCircle2 size={17} aria-hidden="true" /><span>Built for independent gyms and growing fitness teams</span></div>
        </div>
        <div className="landing-hero-image">
          <img
            src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1400&q=85"
            alt="Bright, well-equipped gym floor ready for members"
          />
          <div className="landing-image-caption"><span>YOUR FLOOR, IN FLOW</span><strong>Run the gym. Not the paperwork.</strong></div>
        </div>
        <div className="landing-index" aria-hidden="true">NG / 01</div>
      </section>

      <section className="landing-application" id="apply">
        <div className="application-copy">
          <p className="landing-kicker"><span /> Start a conversation</p>
          <h2>Let’s build a stronger gym, together.</h2>
          <p>Tell us a little about your gym. Our team will review your application and reach out with the next steps.</p>
          <div className="application-note"><span>01</span><p>Share your gym details<br /><span>We’ll review every application personally.</span></p></div>
          <div className="application-note"><span>02</span><p>Meet the NuraGym team<br /><span>We’ll help you find the right setup.</span></p></div>
        </div>

        <form className="application-form" onSubmit={handleSubmit}>
          <div className="application-form-heading"><span>GYM APPLICATION</span><span>01 — 05</span></div>
          {message && <div className="application-feedback success" role="status">{message}</div>}
          {error && <div className="application-feedback failure" role="alert">{error}</div>}
          <label>Gym name<input required minLength="2" maxLength="255" name="gymName" value={form.gymName} onChange={updateField} placeholder="e.g. Northside Strength" /></label>
          <label>Owner name<input required minLength="2" maxLength="255" name="ownerName" value={form.ownerName} onChange={updateField} placeholder="Your full name" /></label>
          <div className="application-form-row">
            <label>Email address<input required type="email" maxLength="255" name="email" value={form.email} onChange={updateField} placeholder="you@gym.com" /></label>
            <label>Phone number<input required type="tel" minLength="7" maxLength="50" name="phone" value={form.phone} onChange={updateField} placeholder="+1 555 000 0000" /></label>
          </div>
          <label>Gym location<input required minLength="2" maxLength="255" name="location" value={form.location} onChange={updateField} placeholder="City, region, or full address" /></label>
          <button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Sending application…' : 'Submit application'} <ArrowUpRight size={17} aria-hidden="true" /></button>
          <small>By submitting, you agree to be contacted about NuraGym.</small>
        </form>
      </section>
      <footer className="landing-footer"><a className="landing-brand" href="#top"><Activity size={18} aria-hidden="true" /><span>NuraGym</span></a><span>Management that moves with your gym.</span><Link to="/login">Sign in <ArrowUpRight size={14} aria-hidden="true" /></Link></footer>
    </main>
  );
}