export default function Loading() {
  return (
    <div className="empty" role="status" aria-live="polite">
      <h2>Loading your workspace</h2>
      <p className="subtle">Reading saved plans from this browser.</p>
    </div>
  );
}
