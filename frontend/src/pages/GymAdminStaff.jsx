import { useState } from 'react';

const mockStaff = [
  { name: 'Sam Lee', role: 'Gym Manager', email: 'sam@nuragym.com', status: 'Active' },
  { name: 'Nina Shah', role: 'Trainer', email: 'nina@nuragym.com', status: 'Active' },
  { name: 'Olivia Chen', role: 'Trainer', email: 'olivia@nuragym.com', status: 'On Leave' }
];

export default function GymAdminStaff() {
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
          <h1>Staff</h1>
        </div>
        <button type="button" className="primary-button" onClick={() => setIsModalOpen(true)}>Add Staff</button>
      </header>

      <section className="panel">
        <div className="section-heading">
          <h2>Staff directory</h2>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Role</th>
              <th>Email</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {mockStaff.map((member) => (
              <tr key={member.email}>
                <td>{member.name}</td>
                <td>{member.role}</td>
                <td>{member.email}</td>
                <td>
                  <span className={`status-pill ${member.status === 'Active' ? 'success' : 'warning'}`}>
                    {member.status}
                  </span>
                </td>
                <td>
                  <div className="table-actions">
                    <button type="button" className="link-button" onClick={() => alert('Action clicked')}>Edit</button>
                    <button type="button" className="link-button danger" onClick={() => alert('Action clicked')}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-card" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h3>Add Staff</h3>
              <button type="button" className="link-button" onClick={() => setIsModalOpen(false)}>Close</button>
            </div>

            <form className="workflow-form" onSubmit={handleSubmit}>
              <label>
                Full Name
                <input type="text" placeholder="Enter staff name" />
              </label>
              <label>
                Email
                <input type="email" placeholder="Enter email" />
              </label>
              <label>
                Phone
                <input type="tel" placeholder="Enter phone number" />
              </label>
              <label>
                Role
                <select defaultValue="">
                  <option value="" disabled>Select role</option>
                  <option value="Gym Manager">Gym Manager</option>
                  <option value="Trainer">Trainer</option>
                </select>
              </label>
              <div className="modal-actions">
                <button type="button" className="ghost-button" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="primary-button">Save Staff</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
