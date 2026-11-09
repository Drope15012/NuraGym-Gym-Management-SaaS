import { useState } from 'react';

const initialPlans = [
  { name: 'Monthly', price: '$79', duration: '1 month' },
  { name: 'Quarterly', price: '$199', duration: '3 months' },
  { name: 'Yearly', price: '$699', duration: '12 months' },
  { name: 'Premium', price: '$119', duration: '1 month' }
];

export default function GymAdminSubscriptions() {
  const [plans, setPlans] = useState(initialPlans);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);

  const handleSubmit = (event) => {
    event.preventDefault();
    setIsModalOpen(false);
  };

  const handleEditSubmit = (event) => {
    event.preventDefault();

    setPlans((currentPlans) =>
      currentPlans.map((plan) =>
        plan.name === editingPlan.name ? { ...plan, ...editingPlan } : plan
      )
    );

    setIsEditModalOpen(false);
    setEditingPlan(null);
  };

  const handleDelete = (planName) => {
    if (window.confirm('Are you sure you want to delete this plan?')) {
      setPlans((currentPlans) => currentPlans.filter((plan) => plan.name !== planName));
    }
  };

  const handleEditClick = (plan) => {
    setEditingPlan(plan);
    setIsEditModalOpen(true);
  };

  return (
    <div className="workflow-page">
      <header className="page-header">
        <div>
          <span>Gym Admin</span>
          <h1>Subscriptions</h1>
        </div>
        <button type="button" className="primary-button" onClick={() => setIsModalOpen(true)}>Create Plan</button>
      </header>

      <section className="panel">
        <div className="section-heading">
          <h2>Membership plans</h2>
        </div>

        <div className="card-grid">
          {plans.map((plan) => (
            <article key={plan.name} className="summary-card">
              <h3>{plan.name}</h3>
              <div className="big-number">{plan.price}</div>
              <p>{plan.duration}</p>
              <div className="table-actions compact">
                <button type="button" className="link-button" onClick={() => handleEditClick(plan)}>Edit</button>
                <button type="button" className="link-button danger" onClick={() => handleDelete(plan.name)}>Delete</button>
              </div>
            </article>
          ))}
        </div>
      </section>

      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-card" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h3>Create Plan</h3>
              <button type="button" className="link-button" onClick={() => setIsModalOpen(false)}>Close</button>
            </div>

            <form className="workflow-form" onSubmit={handleSubmit}>
              <label>
                Plan Name
                <input type="text" placeholder="Enter plan name" />
              </label>
              <label>
                Price
                <input type="number" placeholder="Enter price" />
              </label>
              <label>
                Duration (Months)
                <input type="number" placeholder="Enter months" />
              </label>
              <div className="modal-actions">
                <button type="button" className="ghost-button" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="primary-button">Save Plan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isEditModalOpen && editingPlan && (
        <div className="modal-overlay" onClick={() => setIsEditModalOpen(false)}>
          <div className="modal-card" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Plan</h3>
              <button type="button" className="link-button" onClick={() => setIsEditModalOpen(false)}>Close</button>
            </div>

            <form className="workflow-form" onSubmit={handleEditSubmit}>
              <label>
                Plan Name
                <input
                  type="text"
                  value={editingPlan.name}
                  onChange={(event) => setEditingPlan((current) => ({ ...current, name: event.target.value }))}
                />
              </label>
              <label>
                Price
                <input
                  type="text"
                  value={editingPlan.price}
                  onChange={(event) => setEditingPlan((current) => ({ ...current, price: event.target.value }))}
                />
              </label>
              <label>
                Duration
                <input
                  type="text"
                  value={editingPlan.duration}
                  onChange={(event) => setEditingPlan((current) => ({ ...current, duration: event.target.value }))}
                />
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
