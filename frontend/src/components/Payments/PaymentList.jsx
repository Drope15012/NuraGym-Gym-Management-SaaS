export default function PaymentList({ payments }) {
  return (
    <section className="panel" id="payments">
      <h2>Payments</h2>
      <div className="list">
        {payments.map((payment) => (
          <article key={payment._id} className="list-row">
            <div>
              <strong>{payment.member?.name || 'Member'}</strong>
              <span>{payment.method} · {payment.status}</span>
            </div>
            <b>₹{Number(payment.amount).toLocaleString('en-IN')}</b>
          </article>
        ))}
      </div>
    </section>
  );
}
