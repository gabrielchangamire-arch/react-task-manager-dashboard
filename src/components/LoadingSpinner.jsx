export default function LoadingSpinner({ label = "loading..." }) {
  return (
    <div className="loading" role="status" aria-live="polite">
      <span className="loading-dot" />
      <span className="loading-dot" />
      <span className="loading-dot" />
      <span className="loading-label">{label}</span>
    </div>
  );
}
