import { useEffect, useRef, useState } from 'react'
import { ImageIcon, Trash2, Upload } from 'lucide-react'
import { assetUrl } from '../api/client'

const MAX_BYTES = 2 * 1024 * 1024
const TYPES = ['image/jpeg', 'image/png']

export function pictureProblem(file) {
  if (!TYPES.includes(file.type)) return 'Choose a JPG or PNG image.'
  if (file.size > MAX_BYTES) return 'Images must be 2 MB or smaller.'
  return ''
}

// Picks one image and shows it back. `saved` is whatever the server already holds.
export default function CoverField({ label, hint, saved, file, error, onPick, onRemove, round = false, fallback }) {
  const input = useRef(null)
  const [preview, setPreview] = useState('')

  useEffect(() => {
    if (!file) {
      setPreview('')
      return undefined
    }
    const url = URL.createObjectURL(file)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  const shown = preview || assetUrl(saved)
  const shape = round ? 'h-20 w-20 rounded-full' : 'h-24 w-36 rounded-lg'
  const field = label.toLowerCase().replace(/\s+/g, '-')

  return (
    <div>
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      <div className="flex flex-wrap items-center gap-4">
        {shown ? (
          <img src={shown} alt="" className={`${shape} border border-slate-200 object-cover`} />
        ) : (
          fallback || (
            <span className={`${shape} flex items-center justify-center border border-dashed border-slate-200 bg-slate-50 text-slate-400`}>
              <ImageIcon size={22} aria-hidden="true" />
            </span>
          )
        )}

        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn-secondary" onClick={() => input.current?.click()}>
            <Upload size={16} />
            {shown ? 'Change' : 'Choose image'}
          </button>
          {shown && (
            <button type="button" className="btn-danger" onClick={onRemove}>
              <Trash2 size={16} />
              Remove
            </button>
          )}
        </div>
      </div>

      <input
        ref={input}
        id={field}
        name={field}
        type="file"
        accept="image/jpeg,image/png"
        className="sr-only"
        aria-label={label}
        onChange={(e) => {
          const picked = e.target.files?.[0]
          e.target.value = ''
          if (picked) onPick(picked)
        }}
      />

      {error ? (
        <p className="mt-2 text-xs text-red-600">{error}</p>
      ) : (
        hint && <p className="mt-2 text-xs text-slate-500">{hint}</p>
      )}
    </div>
  )
}
