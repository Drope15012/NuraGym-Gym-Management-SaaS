import { useState } from 'react';

const initialEquipment = [
  {
    name: 'Treadmill X9',
    purchaseDate: '2024-02-18',
    lastServiced: '2026-08-10',
    status: 'Operational'
  },
  {
    name: 'Leg Press Pro',
    purchaseDate: '2023-11-12',
    lastServiced: '2026-07-30',
    status: 'Out of Order'
  },
  {
    name: 'Rowing Machine Elite',
    purchaseDate: '2025-01-09',
    lastServiced: '2026-09-01',
    status: 'Operational'
  }
];

export default function GymAdminEquipment() {
  const [equipment, setEquipment] = useState(initialEquipment);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingMachine, setEditingMachine] = useState(null);

  const handleSubmit = (event) => {
    event.preventDefault();
    setIsModalOpen(false);
  };

  const handleEditSubmit = (event) => {
    event.preventDefault();

    setEquipment((currentEquipment) =>
      currentEquipment.map((machine) =>
        machine.name === editingMachine.name ? { ...machine, ...editingMachine } : machine
      )
    );

    setIsEditModalOpen(false);
    setEditingMachine(null);
  };

  const handleDelete = (name) => {
    if (window.confirm('Are you sure you want to delete this machine?')) {
      setEquipment((currentEquipment) => currentEquipment.filter((machine) => machine.name !== name));
    }
  };

  const handleEditClick = (machine) => {
    setEditingMachine({ ...machine });
    setIsEditModalOpen(true);
  };

  return (
    <div className="workflow-page">
      <header className="page-header">
        <div>
          <span>Gym Admin</span>
          <h1>Equipment</h1>
        </div>
        <button type="button" className="primary-button" onClick={() => setIsModalOpen(true)}>Add Machine</button>
      </header>

      <section className="panel">
        <div className="section-heading">
          <h2>Machine overview</h2>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>Machine Name</th>
              <th>Purchase Date</th>
              <th>Last Serviced Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {equipment.map((machine) => (
              <tr key={machine.name}>
                <td>{machine.name}</td>
                <td>{machine.purchaseDate}</td>
                <td>{machine.lastServiced}</td>
                <td>
                  <span className={`status-pill ${machine.status === 'Operational' ? 'success' : 'danger'}`}>
                    {machine.status}
                  </span>
                </td>
                <td>
                  <div className="table-actions">
                    <button type="button" className="link-button" onClick={() => handleEditClick(machine)}>Edit</button>
                    <button type="button" className="link-button danger" onClick={() => handleDelete(machine.name)}>Delete</button>
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
              <h3>Add Machine</h3>
              <button type="button" className="link-button" onClick={() => setIsModalOpen(false)}>Close</button>
            </div>

            <form className="workflow-form" onSubmit={handleSubmit}>
              <label>
                Machine Name
                <input type="text" placeholder="Enter machine name" />
              </label>
              <label>
                Purchase Date
                <input type="date" />
              </label>
              <label>
                Last Serviced
                <input type="date" />
              </label>
              <label>
                Status
                <select defaultValue="">
                  <option value="" disabled>Select status</option>
                  <option>Operational</option>
                  <option>Out of Order</option>
                </select>
              </label>
              <div className="modal-actions">
                <button type="button" className="ghost-button" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="primary-button">Save Machine</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isEditModalOpen && editingMachine && (
        <div className="modal-overlay" onClick={() => setIsEditModalOpen(false)}>
          <div className="modal-card" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Machine</h3>
              <button type="button" className="link-button" onClick={() => setIsEditModalOpen(false)}>Close</button>
            </div>

            <form className="workflow-form" onSubmit={handleEditSubmit}>
              <label>
                Machine Name
                <input type="text" defaultValue={editingMachine.name} onChange={(event) => setEditingMachine((current) => ({ ...current, name: event.target.value }))} />
              </label>
              <label>
                Purchase Date
                <input type="date" defaultValue={editingMachine.purchaseDate} onChange={(event) => setEditingMachine((current) => ({ ...current, purchaseDate: event.target.value }))} />
              </label>
              <label>
                Last Serviced
                <input type="date" defaultValue={editingMachine.lastServiced} onChange={(event) => setEditingMachine((current) => ({ ...current, lastServiced: event.target.value }))} />
              </label>
              <label>
                Status
                <select defaultValue={editingMachine.status} onChange={(event) => setEditingMachine((current) => ({ ...current, status: event.target.value }))}>
                  <option>Operational</option>
                  <option>Out of Order</option>
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
