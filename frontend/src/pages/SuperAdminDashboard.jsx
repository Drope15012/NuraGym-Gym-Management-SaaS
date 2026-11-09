import { useEffect, useState } from 'react';
import { api } from '../services/api';

const emptyForm = {
  name: '',
  slug: '',
  email: '',
  phone: '',
  location: '',
  logoFile: null,
  adminName: '',
  adminEmail: '',
  adminPhone: '',
  adminPassword: ''
};

export default function SuperAdminDashboard() {
  const [form, setForm] = useState(emptyForm);
  const [gyms, setGyms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [isDeleting, setIsDeleting] = useState('');
  const [editingGymId, setEditingGymId] = useState('');
  const [createdCredentials, setCreatedCredentials] = useState(null);

  useEffect(() => {
    loadGyms();
  }, []);

  async function loadGyms() {
    setIsLoading(true);
    try {
      const response = await api.get('/gyms');
      setGyms(Array.isArray(response.data) ? response.data : []);
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Could not load gyms.'));
    } finally {
      setIsLoading(false);
    }
  }

  async function saveGym(event) {
    event.preventDefault();
    setError('');
    setNotice('');

    if (!editingGymId && form.adminPassword.length < 8) {
      setError('Admin password must be at least 8 characters long.');
      return;
    }

    setIsSaving(true);

    try {
      const formData = new FormData();
      formData.append('name', form.name);
      formData.append('slug', normalizeSlug(form.slug));
      formData.append('email', form.email);
      formData.append('phone', form.phone);
      formData.append('location', form.location);
      if (!editingGymId) {
        formData.append('adminName', form.adminName);
        formData.append('adminEmail', form.adminEmail);
        formData.append('adminPhone', form.adminPhone);
        formData.append('adminPassword', form.adminPassword);
      }
      if (form.logoFile) formData.append('logo', form.logoFile);

      let response;
      if (editingGymId) {
        await api.put(`/gyms/${editingGymId}`, formData);
      } else {
        response = await api.post('/gyms', formData);
      }
      if (response?.data?.admin) {
        setCreatedCredentials({
          role: 'Gym Admin',
          slug: response.data.gym?.slug || normalizeSlug(form.slug),
          email: response.data.admin.email,
          password: form.adminPassword
        });
      }
      setForm(emptyForm);
      setEditingGymId('');
      setNotice(editingGymId ? 'Gym tenant updated successfully.' : 'Gym tenant created successfully.');
      await loadGyms();
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Could not create gym.'));
    } finally {
      setIsSaving(false);
    }
  }

  function editGym(gym) {
    setError('');
    setNotice('');
    setEditingGymId(gym._id);
    setForm({
      name: gym.name || '',
      slug: gym.slug || '',
      email: gym.email || '',
      phone: gym.phone || '',
      location: gym.city || gym.state || '',
      logoFile: null,
      adminName: gym.adminName || '',
      adminEmail: gym.adminEmail || '',
      adminPhone: '',
      adminPassword: ''
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function cancelEdit() {
    setEditingGymId('');
    setForm(emptyForm);
    setError('');
    setNotice('');
  }

  async function deleteGym(gym) {
    if (!window.confirm(`Delete ${gym.name} and all of its data?`)) return;
    setError('');
    setNotice('');
    setIsDeleting(gym._id);
    try {
      await api.delete(`/gyms/${gym._id}`);
      setNotice(`${gym.name} deleted.`);
      await loadGyms();
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Could not delete gym.'));
    } finally {
      setIsDeleting('');
    }
  }

  return (
    <div className="workflow-page">
      <header className="page-header">
        <div><span>Super Admin</span><h1>Gym tenants</h1></div>
      </header>

      {error && <div className="form-error" role="alert">{error}</div>}
      {notice && <div className="form-notice" role="status">{notice}</div>}
      {createdCredentials && <div className="credential-panel" role="status"><strong>Save these login details now. The password will not be shown again.</strong><span>Role: {createdCredentials.role}</span><span>Gym slug: {createdCredentials.slug}</span><span>Email: {createdCredentials.email}</span><span>Password: {createdCredentials.password}</span><button type="button" onClick={() => setCreatedCredentials(null)}>Hide credentials</button></div>}

      <form className="workflow-form" onSubmit={saveGym}>
        <fieldset>
          <legend>Gym details</legend>
          <input required value={form.name} placeholder="Gym name" onChange={(event) => setForm({ ...form, name: event.target.value })} />
          <input required pattern="[a-z0-9\-]+" value={form.slug} placeholder="URL slug" onChange={(event) => setForm({ ...form, slug: normalizeSlug(event.target.value) })} />
          <input required type="email" value={form.email} placeholder="Gym email" onChange={(event) => setForm({ ...form, email: event.target.value })} />
          <input required value={form.phone} placeholder="Gym phone" onChange={(event) => setForm({ ...form, phone: event.target.value })} />
          <input required value={form.location} placeholder="Location" onChange={(event) => setForm({ ...form, location: event.target.value })} />
          <input type="file" accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp" onChange={(event) => setForm({ ...form, logoFile: event.target.files?.[0] || null })} />
        </fieldset>

        <fieldset>
          <legend>Initial Gym Admin</legend>
          <input required={!editingGymId} disabled={Boolean(editingGymId)} value={form.adminName} placeholder="Admin name" onChange={(event) => setForm({ ...form, adminName: event.target.value })} />
          <input required={!editingGymId} disabled={Boolean(editingGymId)} type="email" value={form.adminEmail} placeholder="Admin email" onChange={(event) => setForm({ ...form, adminEmail: event.target.value })} />
          <input value={form.adminPhone} placeholder="Admin phone" onChange={(event) => setForm({ ...form, adminPhone: event.target.value })} />
          <input required={!editingGymId} minLength="8" type="password" value={form.adminPassword} placeholder={editingGymId ? 'Leave blank to keep password' : 'Admin password'} onChange={(event) => setForm({ ...form, adminPassword: event.target.value })} />
        </fieldset>

        <button type="submit" disabled={isSaving}>{isSaving ? 'Saving...' : editingGymId ? 'Update gym' : 'Create gym tenant'}</button>
        {editingGymId && <button type="button" onClick={cancelEdit}>Cancel edit</button>}
      </form>

      <section className="panel">
        <div className="section-heading"><h2>Registered gyms</h2><button type="button" onClick={loadGyms}>Refresh</button></div>
        {isLoading && <p>Loading gyms...</p>}
        {!isLoading && gyms.length === 0 && <p className="empty-state">No gyms have been registered.</p>}
        <div className="list">
          {gyms.map((gym) => (
            <article className="list-row" key={gym._id}>
              <div className="tenant-summary">
                {gym.logoUrl && <img src={gym.logoUrl} alt={`${gym.name} logo`} />}
                <div>
                  <strong>{gym.name}</strong>
                  <span>Gym Slug: {gym.slug}</span>
                  <span>Location: {gym.city || gym.state || 'Not provided'}</span>
                  <span>Admin Name: {gym.adminName || 'Not assigned'}</span>
                  <span>Admin Role: {formatRole(gym.adminRole)}</span>
                  <span>Admin Email: {gym.adminEmail || 'Not available'}</span>
                </div>
              </div>
              <div className="list-row-actions"><span>{gym.phone}</span><button type="button" onClick={() => editGym(gym)}>Edit</button><button type="button" disabled={isDeleting === gym._id} onClick={() => deleteGym(gym)}>{isDeleting === gym._id ? 'Deleting...' : 'Delete'}</button></div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function getErrorMessage(error, fallback) {
  if (error.response?.data?.message) return error.response.data.message;
  if (error.response?.data?.details?.fieldErrors) {
    return Object.entries(error.response.data.details.fieldErrors)
      .flatMap(([field, messages]) => `${field}: ${messages.join(', ')}`)
      .join('; ');
  }
  return error.request ? 'The server did not respond. Check that the backend is running.' : fallback;
}

function formatRole(role) {
  return role ? role.replace('_', ' ') : 'Not assigned';
}

function normalizeSlug(value) {
  return value.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-');
}
