import {
  CheckCircle,
  Info,
  X,
  XCircle,
} from 'lucide-react'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { createPortal } from 'react-dom'

type ToastVariant = 'success' | 'error' | 'info'

type Toast = {
  id: string
  message: string
  variant: ToastVariant
  exiting: boolean
}

type ToastContextValue = {
  success: (message: string) => void
  error: (message: string) => void
  info: (message: string) => void
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined)

let toastCounter = 0

const TOAST_DURATION = 4000
const TOAST_EXIT_DURATION = 280

type ToastProviderProps = {
  children: React.ReactNode
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  const dismiss = useCallback((id: string) => {
    // Mark as exiting for animation
    setToasts((current) =>
      current.map((t) => (t.id === id ? { ...t, exiting: true } : t)),
    )
    // Remove after animation
    const exitTimer = setTimeout(() => {
      setToasts((current) => current.filter((t) => t.id !== id))
      timers.current.delete(id)
    }, TOAST_EXIT_DURATION)
    timers.current.set(`${id}-exit`, exitTimer)
  }, [])

  const addToast = useCallback(
    (message: string, variant: ToastVariant) => {
      toastCounter += 1
      const id = `toast-${toastCounter}`

      setToasts((current) => [...current, { id, message, variant, exiting: false }])

      const timer = setTimeout(() => {
        dismiss(id)
      }, TOAST_DURATION)

      timers.current.set(id, timer)
    },
    [dismiss],
  )

  // Cleanup timers on unmount
  useEffect(() => {
    const currentTimers = timers.current
    return () => {
      currentTimers.forEach((timer) => clearTimeout(timer))
    }
  }, [])

  const value = useMemo<ToastContextValue>(
    () => ({
      success: (msg) => addToast(msg, 'success'),
      error: (msg) => addToast(msg, 'error'),
      info: (msg) => addToast(msg, 'info'),
    }),
    [addToast],
  )

  return (
    <ToastContext.Provider value={value}>
      {children}
      {createPortal(
        <div className="toast-container" aria-live="polite" aria-atomic="true">
          {toasts.map((toast) => (
            <ToastItem key={toast.id} toast={toast} onDismiss={dismiss} />
          ))}
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  )
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  const icons: Record<ToastVariant, React.ReactNode> = {
    success: <CheckCircle size={18} className="toast-icon" />,
    error: <XCircle size={18} className="toast-icon" />,
    info: <Info size={18} className="toast-icon" />,
  }

  return (
    <div
      className={`toast toast-${toast.variant}${toast.exiting ? ' toast-exit' : ''}`}
      role="alert"
    >
      {icons[toast.variant]}
      <span className="toast-message">{toast.message}</span>
      <button
        className="toast-close"
        type="button"
        onClick={() => onDismiss(toast.id)}
        aria-label="Cerrar notificacion"
      >
        <X size={14} />
      </button>
    </div>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast debe usarse dentro de ToastProvider.')
  }
  return context
}
