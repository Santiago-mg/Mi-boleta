type ErrorMessageProps = {
  message: string
  onRetry?: () => void
}

export function ErrorMessage({ message, onRetry }: ErrorMessageProps) {
  return (
    <div className="error-state" role="alert">
      <div>
        <strong>Algo no salio bien</strong>
        <p>{message}</p>
      </div>

      {onRetry ? (
        <button className="ghost-button" type="button" onClick={onRetry}>
          Reintentar
        </button>
      ) : null}
    </div>
  )
}
