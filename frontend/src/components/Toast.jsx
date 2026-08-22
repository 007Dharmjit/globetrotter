import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { CheckCircle2, XCircle } from 'lucide-react'

const ToastContext = createContext(null)
let nextId = 1

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const notify = useCallback((message, tone = 'success') => {
    const id = nextId++
    setToasts((current) => [...current, { id, message, tone }])
    setTimeout(() => setToasts((current) => current.filter((t) => t.id !== id)), 3000)
  }, [])

  const value = useMemo(() => ({ notify }), [notify])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-50 flex w-72 flex-col gap-2">
        {toasts.map(({ id, message, tone }) => (
          <div
            key={id}
            role="status"
            className={`animate-[fadeIn_.18s_ease-out] flex items-start gap-2 rounded-lg border px-3 py-2 text-sm shadow-sm ${
              tone === 'error' ? 'border-red-200 bg-red-50 text-red-800' : 'border-slate-200 bg-white text-slate-800'
            }`}
          >
            {tone === 'error' ? (
              <XCircle size={18} className="mt-0.5 shrink-0 text-red-600" />
            ) : (
              <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-green-600" />
            )}
            <span>{message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  return useContext(ToastContext)
}
