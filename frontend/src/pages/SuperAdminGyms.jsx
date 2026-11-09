import { useEffect, useState } from 'react';
import { api } from '../services/api';

const emptyForm = {
  name: '', slug: '', email: '', phone: '', logoUrl: '',
  adminName: '', adminEmail: '', adminPhone: '', adminPassword: '',
  line1: '', city: '', state: '', postalCode: '', country: 'India'
};

export default function SuperAdminGyms() {
  const [form, setForm] = useState(emptyForm);
  const [logoFileName, setLogoFileName] = useState('');
  const [gyms, setGyms] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  async function loadGyms() {
    const response = await api.get('/gyms');
    setGyms(response.data);
  }

  useEffect(() => {
    loadGyms().catch((requestError) => setError(requestError.response?.data?.message || 'Could not load gyms.'));
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage('');
    setError('');
    setIsSaving(true);
    try {
      await api.post('/gyms', {
        name: form.name,
        slug: form.slug,
        email: form.email,
        phone: form.phone,
        logoUrl: form.logoUrl || undefined,
        initialAdmin: {
          name: form.adminName,
          email: form.adminEmail,
          phone: form.adminPhone || undefined,
          password: form.adminPassword
        },
        address: {
          line1: form.line1,
          city: form.city,
          state: form.state,
          postalCode: form.postalCode || undefined,
          country: form.country
        }
      });
      setForm(emptyForm);
      setLogoFileName('');
      setMessage('Gym tenant and Gym Admin created.');
      await loadGyms();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not create gym.');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleLogoFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/') || file.size > 2 * 1024 * 1024) {
      setError('Choose an image file up to 2 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setForm((current) => ({ ...current, logoUrl: String(reader.result) }));
      setLogoFileName(file.name);
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="workflow-page">
      <header className="page-header"><div><span>Platform</span><h1>Create gym tenant</h1></div></header>
      {message && <div className="form-notice">{message}</div>}
      {error && <div className="form-error">{error}</div>}
      <form className="workflow-form" onSubmit={handleSubmit}>
        <fieldset><legend>Gym details</legend>
          <input required placeholder="Gym name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
          <input required pattern="[a-z0-9-]+" placeholder="URL slug" value={form.slug} onChange={(event) => setForm({ ...form, slug: event.target.value })} />
          <input required type="email" placeholder="Gym email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
          <input required placeholder="Gym phone" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
          <input placeholder="Logo URL (optional)" value={form.logoUrl.startsWith('data:') ? '' : form.logoUrl} onChange={(event) => setForm({ ...form, logoUrl: event.target.value })} />
          <label className="file-field">Upload logo (optional)<input type="file" accept="image/*" onChange={handleLogoFile} /></label>
          {logoFileName && <small>{logoFileName}</small>}
        </fieldset>
        <fieldset><legend>Initial Gym Admin</legend>
          <input required placeholder="Admin name" value={form.adminName} onChange={(event) => setForm({ ...form, adminName: event.target.value })} />
          <input required type="email" placeholder="Admin email" value={form.adminEmail} onChange={(event) => setForm({ ...form, adminEmail: event.target.value })} />
          <input placeholder="Admin phone" value={form.adminPhone} onChange={(event) => setForm({ ...form, adminPhone: event.target.value })} />
          <input required minLength="8" type="password" placeholder="Temporary password" value={form.adminPassword} onChange={(event) => setForm({ ...form, adminPassword: event.target.value })} />
        </fieldset>
        <fieldset><legend>Gym address</legend>
          <input required placeholder="Address" value={form.line1} onChange={(event) => setForm({ ...form, line1: event.target.value })} />
          <input required placeholder="City" value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })} />
          <input required placeholder="State" value={form.state} onChange={(event) => setForm({ ...form, state: event.target.value })} />
          <input placeholder="Postal code" value={form.postalCode} onChange={(event) => setForm({ ...form, postalCode: event.target.value })} />
          <input required placeholder="Country" value={form.country} onChange={(event) => setForm({ ...form, country: event.target.value })} />
        </fieldset>
        <button type="submit" disabled={isSaving}>{isSaving ? 'Creating...' : 'Create gym tenant'}</button>
      </form>
      <section className="panel"><h2>Gym tenants</h2><button type="button" onClick={loadGyms}>Refresh</button><div className="list">{gyms.map((gym) => <article className="list-row" key={gym._id}><div><strong>{gym.name}</strong><span>{gym.slug} · {gym.status}</span></div><span>{gym.email}</span></article>)}</div></section>
    </div>
  );
}
