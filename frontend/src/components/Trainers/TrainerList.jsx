export default function TrainerList({ trainers = [] }) {
  return (
    <section className="panel">
      <h2>Trainers</h2>
      {trainers.map((trainer) => <p key={trainer._id}>{trainer.name}</p>)}
    </section>
  );
}
