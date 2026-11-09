import { useState } from 'react';

export default function GymAdminCommunications() {
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
          <h1>Communications</h1>
        </div>
      </header>

      <section className="panel">
        <form className="workflow-form" onSubmit={handleSubmit}>
          <label>
            Subject
            <input type="text" defaultValue="Monthly membership reminder" />
          </label>

          <label>
            Message Body
            <textarea rows="6" defaultValue="Hi everyone, this is a reminder about your upcoming membership renewal and class enrollment opportunities." />
          </label>

          <label>
            Target Audience
            <select defaultValue="All Members">
              <option>All Members</option>
              <option>Active Only</option>
              <option>Pending Dues</option>
            </select>
          </label>

          <button type="button" className="primary-button" onClick={() => setIsModalOpen(true)}>Send Campaign</button>
        </form>
      </section>

      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-card" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h3>Send Campaign</h3>
              <button type="button" className="link-button" onClick={() => setIsModalOpen(false)}>Close</button>
            </div>

            <form className="workflow-form" onSubmit={handleSubmit}>
              <label>
                Campaign Name
                <input type="text" placeholder="Enter campaign name" />
              </label>
              <label>
                Message Preview
                <textarea rows="5" defaultValue="Hi everyone, this is a reminder about your upcoming membership renewal and class enrollment opportunities." />
              </label>
              <div className="modal-actions">
                <button type="button" className="ghost-button" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="primary-button">Send Now</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
