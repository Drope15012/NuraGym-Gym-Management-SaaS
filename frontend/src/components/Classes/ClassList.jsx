export default function ClassList({ classes }) {
  return (
    <section className="panel" id="classes">
      <h2>Classes</h2>
      <div className="list">
        {classes.map((item) => (
          <article key={item._id} className="list-row">
            <div>
              <strong>{item.title}</strong>
              <span>{item.trainer?.name || 'Trainer'} · {new Date(item.startsAt).toLocaleString()}</span>
            </div>
            <b>{item.attendees?.length || 0}/{item.capacity}</b>
          </article>
        ))}
      </div>
    </section>
  );
}
