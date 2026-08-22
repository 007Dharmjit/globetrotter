import { Mail, MessageCircle, X } from 'lucide-react'

// Standard share endpoints — each opens the service with the trip name and the public link.
function targets(tripName, url) {
  const line = `${tripName} — my trip on GlobeTrotter`
  return [
    {
      label: 'WhatsApp',
      icon: MessageCircle,
      href: `https://wa.me/?text=${encodeURIComponent(`${line}\n${url}`)}`,
      external: true,
    },
    {
      label: 'X',
      icon: X,
      href: `https://x.com/intent/post?text=${encodeURIComponent(line)}&url=${encodeURIComponent(url)}`,
      external: true,
    },
    {
      label: 'Email',
      icon: Mail,
      href: `mailto:?subject=${encodeURIComponent(line)}&body=${encodeURIComponent(`${line}\n\n${url}`)}`,
      external: false,
    },
  ]
}

export default function ShareButtons({ tripName, url }) {
  if (!url) return null

  return (
    <div className="flex flex-wrap gap-2">
      {targets(tripName, url).map(({ label, icon: Icon, href, external }) => (
        <a
          key={label}
          className="btn-secondary"
          href={href}
          aria-label={`Share on ${label}`}
          {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        >
          <Icon size={16} />
          {label}
        </a>
      ))}
    </div>
  )
}
