import { useState } from 'react';

const initialSchedule = [
  {
    className: 'HIIT Burn',
    trainer: 'Sam Lee',
    time: 'Mon 6:00 PM',
    capacity: '18 / 20'
  },
  {
    className: 'Strength Circuit',
    trainer: 'Nina Shah',
    time: 'Tue 7:30 AM',
    capacity: '12 / 16'
  },
  {
    className: 'Yoga Flow',
    trainer: 'Olivia Chen',
    time: 'Wed 6:30 PM',
    capacity: '15 / 15'
  }
];

export default function GymAdminScheduling() {
  const [schedule, setSchedule] = useState(initialSchedule);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState(null);

  const handleSubmit = (event) => {
    event.preventDefault();
    setIsModalOpen(false);
  };

  const handleEditSubmit = (event) => {
    event.preventDefault();

    setSchedule((currentSchedule) =>
      currentSchedule.map((session) =>
        session.className === editingClass.className ? { ...session, ...editingClass } : session
      )
    );

    setIsEditModalOpen(false);
    setEditingClass(null);
  };

  const handleDelete = (className) => {
    if (window.confirm('Are you sure you want to delete this class?')) {
      setSchedule((currentSchedule) => currentSchedule.filter((session) => session.className !== className));
    }
  };

  const handleEditClick = (session) => {
    setEditingClass({ ...session });
    setIsEditModalOpen(true);
  };

  return (
    <div className="workflow-page">
      <header className="page-header">
        <div>
          <span>Gym Admin</span>
          <h1>Scheduling</h1>
        </div>
        <button type="button" className="primary-button" onClick={() => setIsModalOpen(true)}>Schedule Class</button>
      </header>

      <section className="panel">
        <div className="section-heading">
          <h2>Upcoming classes</h2>
        </div>

        <div className="card-grid">
          {schedule.map((session) => (
            <article key={session.className} className="summary-card">
              <h3>{session.className}</h3>
              <p>Trainer: {session.trainer}</p>
              <p>Time: {session.time}</p>
              <p>Capacity: {session.capacity}</p>
              <div className="table-actions compact">
                <button type="button" className="link-button" onClick={() => handleEditClick(session)}>Edit</button>
                <button type="button" className="link-button danger" onClick={() => handleDelete(session.className)}>Delete</button>
              </div>
            </article>
          ))}
        </div>
      </section>

      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-card" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h3>Schedule Class</h3>
              <button type="button" className="link-button" onClick={() => setIsModalOpen(false)}>Close</button>
            </div>

            <form className="workflow-form" onSubmit={handleSubmit}>
              <label>
                Class Name
                <input type="text" placeholder="Enter class name" />
              </label>
              <label>
                Trainer
                <input type="text" placeholder="Enter trainer name" />
              </label>
              <label>
                Date/Time
                <input type="datetime-local" />
              </label>
              <label>
                Capacity
                <input type="number" placeholder="Enter capacity" />
              </label>
              <div className="modal-actions">
                <button type="button" className="ghost-button" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="primary-button">Save Class</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isEditModalOpen && editingClass && (
        <div className="modal-overlay" onClick={() => setIsEditModalOpen(false)}>
          <div className="modal-card" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Class</h3>
              <button type="button" className="link-button" onClick={() => setIsEditModalOpen(false)}>Close</button>
            </div>

            <form className="workflow-form" onSubmit={handleEditSubmit}>
              <label>
                Class Name
                <input type="text" defaultValue={editingClass.className} onChange={(event) => setEditingClass((current) => ({ ...current, className: event.target.value }))} />
              </label>
              <label>
                Trainer
                <input type="text" defaultValue={editingClass.trainer} onChange={(event) => setEditingClass((current) => ({ ...current, trainer: event.target.value }))} />
              </label>
              <label>
                Time
                <input type="text" defaultValue={editingClass.time} onChange={(event) => setEditingClass((current) => ({ ...current, time: event.target.value }))} />
              </label>
              <label>
                Capacity
                <input type="text" defaultValue={editingClass.capacity} onChange={(event) => setEditingClass((current) => ({ ...current, capacity: event.target.value }))} />
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
