export default function FormInput({ label, name, error, hint, as = 'input', ...props }) {
  const Field = as
  const describedBy = error ? `${name}-error` : hint ? `${name}-hint` : undefined

  return (
    <div>
      <label htmlFor={name} className="mb-1 block text-sm font-medium text-slate-700">
        {label}
      </label>
      <Field
        id={name}
        name={name}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={describedBy}
        className={[
          'input',
          as === 'textarea' ? 'h-auto min-h-24 py-2' : '',
          error ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : '',
        ].join(' ')}
        {...props}
      />
      {error ? (
        <p id={`${name}-error`} className="mt-1 text-xs text-red-600">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${name}-hint`} className="mt-1 text-xs text-slate-500">
            {hint}
          </p>
        )
      )}
    </div>
  )
}
