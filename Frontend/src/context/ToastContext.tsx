import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { AlertCircle, CheckCircle2, X } from 'lucide-react'

interface Toast {
  id: number
  message: string
  type: 'success' | 'info' | 'error'
}

interface ToastContextValue {
  showSuccess: (message: string) => void
  showInfo: (message: string) => void
  showError: (message: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const push = useCallback(
    (message: string, type: Toast['type']) => {
      const id = Date.now()
      setToasts((prev) => [...prev, { id, message, type }])
      window.setTimeout(() => dismiss(id), 3500)
    },
    [dismiss]
  )

  const value = useMemo(
    () => ({
      showSuccess: (message: string) => push(message, 'success'),
      showInfo: (message: string) => push(message, 'info'),
      showError: (message: string) => push(message, 'error'),
    }),
    [push]
  )

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed bottom-4 right-4 z-[70] flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center gap-3 min-w-[280px] max-w-sm px-4 py-3 rounded-lg border shadow-lg ${
              toast.type === 'success'
                ? 'bg-white border-green-200 text-green-900'
                : toast.type === 'error'
                  ? 'bg-white border-red-200 text-red-900'
                  : 'bg-white border-gray-200 text-gray-900'
            }`}
          >
            {toast.type === 'error' ? (
              <AlertCircle size={18} className="text-red-600 shrink-0" />
            ) : (
              <CheckCircle2 size={18} className={toast.type === 'success' ? 'text-green-600 shrink-0' : 'text-corporate shrink-0'} />
            )}
            <p className="text-sm flex-1">{toast.message}</p>
            <button
              type="button"
              onClick={() => dismiss(toast.id)}
              className="p-1 rounded text-gray-400 hover:text-gray-600"
              aria-label="Cerrar"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast debe usarse dentro de ToastProvider')
  return ctx
}
