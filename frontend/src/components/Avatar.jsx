import { assetUrl } from '../api/client'

export function initials(name) {
  const letters = (name || '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('')
  return letters || '?'
}

// The traveller's picture, or their initials while they have not set one.
export default function Avatar({ user, size = 'h-8 w-8', text = 'text-xs' }) {
  if (user?.avatar) {
    return <img src={assetUrl(user.avatar)} alt="" className={`${size} rounded-full border border-slate-200 object-cover`} />
  }

  return (
    <span
      aria-hidden="true"
      className={`${size} ${text} flex items-center justify-center rounded-full bg-primary/10 font-semibold text-primary`}
    >
      {initials(user?.name)}
    </span>
  )
}
