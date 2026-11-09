import { useState } from 'react';

const initialLeads = [
  {
    id: 'L-1001',
    name: 'Liam H.',
    contact: 'liam@example.com',
    stage: 'New Inquiries'
  },
  {
    id: 'L-1002',
    name: 'Sophia T.',
    contact: '+1 (555) 212-7441',
    stage: 'New Inquiries'
  },
  {
    id: 'L-1003',
    name: 'Ava M.',
    contact: 'ava@example.com',
    stage: 'Trial Active'
  },
  {
    id: 'L-1004',
    name: 'Grace D.',
    contact: '+1 (555) 877-2409',
    stage: 'Converted'
  }
];

export default function GymAdminLeads() {
  const [leads, setLeads] = useState(initialLeads);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState(null);

  const handleSubmit = (event) => {
    event.preventDefault();
    setIsModalOpen(false);
  };

  const handleEditSubmit = (event) => {
    event.preventDefault();

    setLeads((currentLeads) =>
      currentLeads.map((lead) =>
        lead.id === editingLead.id ? { ...lead, ...editingLead } : lead
      )
    );

    setIsEditModalOpen(false);
    setEditingLead(null);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this lead?')) {
      setLeads((currentLeads) => currentLeads.filter((lead) => lead.id !== id));
    }
  };

  const handleEditClick = (lead) => {
    setEditingLead({ ...lead });
    setIsEditModalOpen(true);
  };

  return (
    <div className="workflow-page">
      <header className="page-header">
        <div>
          <span>Gym Admin</span>
          <h1>Leads</h1>
        </div>
        <button type="button" className="primary-button" onClick={() => setIsModalOpen(true)}>New Lead</button>
      </header>

      <section className="panel">
        <div className="kanban-board">
          {['New Inquiries', 'Trial Active', 'Converted', 'Lost'].map((stage) => (
            <div key={stage} className="kanban-column">
              <h3>{stage}</h3>
              {leads.filter((lead) => lead.stage === stage).map((lead) => (
                <div key={lead.id} className="kanban-card">
                  <strong>{lead.name}</strong>
                  <p>{lead.contact}</p>
                  <div className="table-actions compact">
                    <button type="button" className="link-button" onClick={() => handleEditClick(lead)}>Edit</button>
                    <button type="button" className="link-button danger" onClick={() => handleDelete(lead.id)}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>

      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-card" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h3>New Lead</h3>
              <button type="button" className="link-button" onClick={() => setIsModalOpen(false)}>Close</button>
            </div>

            <form className="workflow-form" onSubmit={handleSubmit}>
              <label>
                Lead Name
                <input type="text" placeholder="Enter lead name" />
              </label>
              <label>
                Contact Info
                <input type="text" placeholder="Phone or email" />
              </label>
              <label>
                Initial Status
                <select defaultValue="">
                  <option value="" disabled>Select status</option>
                  <option>New Inquiries</option>
                  <option>Trial Active</option>
                  <option>Converted</option>
                  <option>Lost</option>
                </select>
              </label>
              <div className="modal-actions">
                <button type="button" className="ghost-button" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="primary-button">Save Lead</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isEditModalOpen && editingLead && (
        <div className="modal-overlay" onClick={() => setIsEditModalOpen(false)}>
          <div className="modal-card" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Lead</h3>
              <button type="button" className="link-button" onClick={() => setIsEditModalOpen(false)}>Close</button>
            </div>

            <form className="workflow-form" onSubmit={handleEditSubmit}>
              <label>
                Lead Name
                <input type="text" defaultValue={editingLead.name} onChange={(event) => setEditingLead((current) => ({ ...current, name: event.target.value }))} />
              </label>
              <label>
                Contact Info
                <input type="text" defaultValue={editingLead.contact} onChange={(event) => setEditingLead((current) => ({ ...current, contact: event.target.value }))} />
              </label>
              <label>
                Stage
                <select defaultValue={editingLead.stage} onChange={(event) => setEditingLead((current) => ({ ...current, stage: event.target.value }))}>
                  <option>New Inquiries</option>
                  <option>Trial Active</option>
                  <option>Converted</option>
                  <option>Lost</option>
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
