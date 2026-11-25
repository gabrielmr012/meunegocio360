import { Alert, Button } from 'react-bootstrap';

export default function ErrorAlert({
  message,
  onRetry,
  retryLabel = 'Tentar novamente',
}) {
  if (!message) return null;

  return (
    <Alert
      variant="danger"
      role="alert"
      className="d-flex flex-column align-items-start gap-2"
    >
      <span>{message}</span>
      {onRetry && (
        <Button variant="outline-dark" onClick={onRetry} className="error-alert-retry">
          {retryLabel}
        </Button>
      )}
    </Alert>
  );
}
