import { useState } from 'react';

const mockAttendance = [
  {
    name: 'Alicia Gomez',
    checkIn: '07:15 AM',
    checkOut: '08:20 AM'
  },
  {
    name: 'Marcus Hale',
    checkIn: '12:10 PM',
    checkOut: '01:00 PM'
  },
  {
    name: 'Priya Singh',
    checkIn: '06:40 PM',
    checkOut: '07:50 PM'
  }
];

export default function GymAdminAttendance() {
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
          <h1>Attendance</h1>
        </div>
        <button type="button" className="primary-button" onClick={() => setIsModalOpen(true)}>Scan QR</button>
      </header>

      <section className="panel">
        <div className="section-heading">
          <h2>Daily attendance log</h2>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>Member Name</th>
              <th>Check-in Time</th>
              <th>Check-out Time</th>
            </tr>
          </thead>
          <tbody>
            {mockAttendance.map((entry) => (
              <tr key={entry.name}>
                <td>{entry.name}</td>
                <td>{entry.checkIn}</td>
                <td>{entry.checkOut}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-card" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h3>Scan QR</h3>
              <button type="button" className="link-button" onClick={() => setIsModalOpen(false)}>Close</button>
            </div>

            <form className="workflow-form" onSubmit={handleSubmit}>
              <label>
                Member QR Code
                <input type="text" placeholder="Scan member QR code" />
              </label>
              <label>
                Check-in Type
                <select defaultValue="Check In">
                  <option>Check In</option>
                  <option>Check Out</option>
                </select>
              </label>
              <div className="modal-actions">
                <button type="button" className="ghost-button" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="primary-button">Confirm</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
