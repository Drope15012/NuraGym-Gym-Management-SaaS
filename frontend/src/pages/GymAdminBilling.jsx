import { useState } from 'react';

const initialInvoices = [
  {
    id: 'INV-4012',
    member: 'Alicia Gomez',
    date: '2026-09-15',
    amount: '$79.00',
    status: 'Paid'
  },
  {
    id: 'INV-4013',
    member: 'Marcus Hale',
    date: '2026-09-14',
    amount: '$120.00',
    status: 'Pending'
  },
  {
    id: 'INV-4014',
    member: 'Priya Singh',
    date: '2026-09-10',
    amount: '$199.00',
    status: 'Overdue'
  }
];

export default function GymAdminBilling() {
  const [invoices, setInvoices] = useState(initialInvoices);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);

  const handleSubmit = (event) => {
    event.preventDefault();
    setIsModalOpen(false);
  };

  const handleEditSubmit = (event) => {
    event.preventDefault();

    setInvoices((currentInvoices) =>
      currentInvoices.map((invoice) =>
        invoice.id === editingInvoice.id ? { ...invoice, ...editingInvoice } : invoice
      )
    );

    setIsEditModalOpen(false);
    setEditingInvoice(null);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this invoice?')) {
      setInvoices((currentInvoices) => currentInvoices.filter((invoice) => invoice.id !== id));
    }
  };

  const handleEditClick = (invoice) => {
    setEditingInvoice({ ...invoice });
    setIsEditModalOpen(true);
  };

  return (
    <div className="workflow-page">
      <header className="page-header">
        <div>
          <span>Gym Admin</span>
          <h1>Billing</h1>
        </div>
        <button type="button" className="primary-button" onClick={() => setIsModalOpen(true)}>Create Invoice</button>
      </header>

      <section className="panel">
        <div className="section-heading">
          <h2>Invoices and transactions</h2>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>Invoice ID</th>
              <th>Member Name</th>
              <th>Date</th>
              <th>Amount</th>
              <th>Payment Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((invoice) => (
              <tr key={invoice.id}>
                <td>{invoice.id}</td>
                <td>{invoice.member}</td>
                <td>{invoice.date}</td>
                <td>{invoice.amount}</td>
                <td>
                  <span className={`status-pill ${
                    invoice.status === 'Paid'
                      ? 'success'
                      : invoice.status === 'Pending'
                        ? 'warning'
                        : 'danger'
                  }`}>
                    {invoice.status}
                  </span>
                </td>
                <td>
                  <div className="table-actions">
                    <button type="button" className="link-button" onClick={() => handleEditClick(invoice)}>Edit</button>
                    <button type="button" className="link-button danger" onClick={() => handleDelete(invoice.id)}>Delete</button>
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
              <h3>Create Invoice</h3>
              <button type="button" className="link-button" onClick={() => setIsModalOpen(false)}>Close</button>
            </div>

            <form className="workflow-form" onSubmit={handleSubmit}>
              <label>
                Member Name
                <input type="text" placeholder="Enter member name" />
              </label>
              <label>
                Amount
                <input type="number" placeholder="Enter amount" />
              </label>
              <label>
                Due Date
                <input type="date" />
              </label>
              <div className="modal-actions">
                <button type="button" className="ghost-button" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="primary-button">Save Invoice</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isEditModalOpen && editingInvoice && (
        <div className="modal-overlay" onClick={() => setIsEditModalOpen(false)}>
          <div className="modal-card" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Invoice</h3>
              <button type="button" className="link-button" onClick={() => setIsEditModalOpen(false)}>Close</button>
            </div>

            <form className="workflow-form" onSubmit={handleEditSubmit}>
              <label>
                Member Name
                <input type="text" defaultValue={editingInvoice.member} onChange={(event) => setEditingInvoice((current) => ({ ...current, member: event.target.value }))} />
              </label>
              <label>
                Amount
                <input type="text" defaultValue={editingInvoice.amount} onChange={(event) => setEditingInvoice((current) => ({ ...current, amount: event.target.value }))} />
              </label>
              <label>
                Due Date
                <input type="date" defaultValue={editingInvoice.date} onChange={(event) => setEditingInvoice((current) => ({ ...current, date: event.target.value }))} />
              </label>
              <label>
                Payment Status
                <select defaultValue={editingInvoice.status} onChange={(event) => setEditingInvoice((current) => ({ ...current, status: event.target.value }))}>
                  <option value="Paid">Paid</option>
                  <option value="Pending">Pending</option>
                  <option value="Overdue">Overdue</option>
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
