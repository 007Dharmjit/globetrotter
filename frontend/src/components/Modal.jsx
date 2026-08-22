import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])'

export default function Modal({ open, title, helper, onClose, children }) {
  const panel = useRef(null)
  const opener = useRef(null)

  useEffect(() => {
    if (!open) return undefined

    opener.current = document.activeElement
    const first = panel.current?.querySelector(FOCUSABLE)
    ;(first || panel.current)?.focus()

    function onKey(e) {
      if (e.key === 'Escape') {
        onClose()
        return
      }
      if (e.key !== 'Tab') return

      // Keep the keyboard inside the dialog while it is open.
      const stops = [...(panel.current?.querySelectorAll(FOCUSABLE) || [])]
      if (stops.length === 0) return
      const edge = e.shiftKey ? stops[0] : stops[stops.length - 1]
      if (document.activeElement === edge) {
        e.preventDefault()
        ;(e.shiftKey ? stops[stops.length - 1] : stops[0]).focus()
      }
    }

    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      opener.current?.focus?.()
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-slate-900/40 p-0 sm:items-center sm:p-4">
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className="fade-in w-full max-w-lg rounded-t-xl border border-slate-200 bg-white p-6 shadow-lg outline-none sm:rounded-xl"
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
            {helper && <p className="mt-1 text-sm text-slate-500">{helper}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
