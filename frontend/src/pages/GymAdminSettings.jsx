import { useState } from 'react';

export default function GymAdminSettings() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSubmit = (event) => {
    event.preventDefault();
    setIsModalOpen(false);
  };

  return (
    <div className="workflow-page">
      <header className="page-header">
        <div>
          <span>Gym Admin</span>
          <h1>Settings</h1>
        </div>
      </header>

      <section className="panel">
        <form className="workflow-form" onSubmit={handleSubmit}>
          <label>
            Gym Name
            <input type="text" defaultValue="NuraGym Downtown" />
          </label>

          <label>
            Address
            <input type="text" defaultValue="128 Fitness Avenue, Suite 400" />
          </label>

          <label>
            Contact Email
            <input type="email" defaultValue="hello@nuragym.com" />
          </label>

          <label>
            Operating Hours
            <input type="text" defaultValue="Mon-Sun: 5:30 AM - 10:00 PM" />
          </label>

          <label>
            Tax Rate
            <input type="text" defaultValue="8.5%" />
          </label>

          <button type="button" className="primary-button" onClick={() => setIsModalOpen(true)}>Save Settings</button>
        </form>
      </section>

      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-card" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h3>Save Settings</h3>
              <button type="button" className="link-button" onClick={() => setIsModalOpen(false)}>Close</button>
            </div>

            <form className="workflow-form" onSubmit={handleSubmit}>
              <label>
                Gym Name
                <input type="text" defaultValue="NuraGym Downtown" />
              </label>
              <label>
                Contact Email
                <input type="email" defaultValue="hello@nuragym.com" />
              </label>
              <div className="modal-actions">
                <button type="button" className="ghost-button" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="primary-button">Confirm Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
