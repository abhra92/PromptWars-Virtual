"use client";
import { useEffect } from "react";
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Route error", error.message);
  }, [error]);
  return (
    <div className="empty" role="alert">
      <h2>Something went wrong</h2>
      <p className="subtle">
        Saved plans stay in this browser. Try this section again.
      </p>
      <button className="button" type="button" onClick={reset}>
        Try again
      </button>
    </div>
  );
}
