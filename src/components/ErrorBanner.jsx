export default function ErrorBanner({ message, onDismiss, onRetry }) {
  if (!message) return null;
  return (
    <div className="error-banner" role="alert">
      <span className="error-banner-text">{message}</span>
      <div className="error-banner-actions">
        {onRetry && (
          <button type="button" onClick={onRetry}>
            retry
          </button>
        )}
        {onDismiss && (
          <button type="button" onClick={onDismiss} aria-label="dismiss error">
            dismiss
          </button>
        )}
      </div>
    </div>
  );
}
