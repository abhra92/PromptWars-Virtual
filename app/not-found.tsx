import Link from "next/link";
export default function NotFound() {
  return (
    <div className="empty">
      <div className="eyebrow">404</div>
      <h2>Page not found</h2>
      <p className="subtle">That link is not part of this workspace.</p>
      <Link className="button" href="/">
        Back to planning
      </Link>
    </div>
  );
}
