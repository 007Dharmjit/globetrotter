import { ImageIcon } from 'lucide-react'
import { assetUrl } from '../api/client'

// The picture at the top of a trip card or trip page, with a calm stand-in when there is none.
export default function TripCover({ trip, height = 'h-32', rounded = '' }) {
  const shared = `${height} w-full ${rounded}`

  if (trip.cover_image) {
    return <img src={assetUrl(trip.cover_image)} alt={`Cover photo for ${trip.name}`} className={`${shared} object-cover`} />
  }

  return (
    <div className={`${shared} flex items-center justify-center border-b border-slate-100 bg-primary/5 text-primary/40`}>
      <ImageIcon size={26} aria-hidden="true" />
    </div>
  )
}
