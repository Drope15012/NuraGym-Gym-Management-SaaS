import { useEffect, useState } from 'react';
import { api } from '../services/api';

export default function GymAdminMembers() {
  const [members, setMembers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState({
    id: '',
    name: '',
    phone: '',
    trainer: '',
    status: 'Active'
  });

  useEffect(() => {
    loadMembers();
  }, []);

  async function loadMembers() {
    try {
      const response = await api.get('/members');
      setMembers(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Failed to load members', error);
    }
  }

  const handleSubmit = (event) => {
    event.preventDefault();
    setIsModalOpen(false);
  };

  const handleEditSubmit = (event) => {
    event.preventDefault();

    setMembers((currentMembers) =>
      currentMembers.map((member) =>
        member.id === editingMember.id ? { ...member, ...editingMember } : member
      )
    );

    setIsEditModalOpen(false);
    setEditingMember({
      id: '',
      name: '',
      phone: '',
      trainer: '',
      status: 'Active'
    });
  };

  const handleDeleteMember = (memberId) => {
    const confirmed = window.confirm('Are you sure you want to delete this member?');

    if (confirmed) {
      setMembers((currentMembers) => currentMembers.filter((member) => member.id !== memberId));
    }
  };

  const handleEditMember = (member) => {
    setEditingMember(member);
    setIsEditModalOpen(true);
  };

  return (
    <div className="workflow-page">
      <header className="page-header">
        <div>
          <span>Gym Admin</span>
          <h1>Members</h1>
        </div>
        <button type="button" className="primary-button" onClick={() => setIsModalOpen(true)}>Add Member</button>
      </header>

      <section className="panel">
        <div className="section-heading">
          <h2>Member roster</h2>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>Member ID</th>
              <th>Name</th>
              <th>Phone</th>
              <th>Assigned Trainer</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {members.map((member) => (
              <tr key={member.id}>
                <td>{member.id}</td>
                <td>{member.name}</td>
                <td>{member.phone}</td>
                <td>{member.trainer}</td>
                <td>
                  <span className={`status-pill ${member.status === 'Active' ? 'success' : 'muted'}`}>
                    {member.status}
                  </span>
                </td>
                <td>
                  <div className="table-actions">
                    <button type="button" className="link-button" onClick={() => handleEditMember(member)}>Edit</button>
                    <button type="button" className="link-button danger" onClick={() => handleDeleteMember(member.id)}>Delete</button>
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
              <h3>Add Member</h3>
              <button type="button" className="link-button" onClick={() => setIsModalOpen(false)}>Close</button>
            </div>

            <form className="workflow-form" onSubmit={handleSubmit}>
              <label>
                Full Name
                <input type="text" placeholder="Enter full name" />
              </label>
              <label>
                Phone
                <input type="tel" placeholder="Enter phone number" />
              </label>
              <label>
                Assigned Trainer
                <input type="text" placeholder="Trainer name" />
              </label>
              <div className="modal-actions">
                <button type="button" className="ghost-button" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="primary-button">Save Member</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isEditModalOpen && (
        <div className="modal-overlay" onClick={() => setIsEditModalOpen(false)}>
          <div className="modal-card" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Member</h3>
              <button type="button" className="link-button" onClick={() => setIsEditModalOpen(false)}>Close</button>
            </div>

            <form className="workflow-form" onSubmit={handleEditSubmit}>
              <label>
                Full Name
                <input
                  type="text"
                  value={editingMember.name}
                  onChange={(event) => setEditingMember((current) => ({ ...current, name: event.target.value }))}
                />
              </label>
              <label>
                Phone
                <input
                  type="tel"
                  value={editingMember.phone}
                  onChange={(event) => setEditingMember((current) => ({ ...current, phone: event.target.value }))}
                />
              </label>
              <label>
                Assigned Trainer
                <input
                  type="text"
                  value={editingMember.trainer}
                  onChange={(event) => setEditingMember((current) => ({ ...current, trainer: event.target.value }))}
                />
              </label>
              <label>
                Status
                <select
                  value={editingMember.status}
                  onChange={(event) => setEditingMember((current) => ({ ...current, status: event.target.value }))}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </label>
              <div className="modal-actions">
                <button type="button" className="ghost-button" onClick={() => setIsEditModalOpen(false)}>Cancel</button>
                <button type="submit" className="primary-button">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
