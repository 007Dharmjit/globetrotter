import { Link } from 'react-router-dom'
import { MapPinOff } from 'lucide-react'
import EmptyState from '../components/EmptyState'

export default function NotFound() {
  return (
    <EmptyState
      icon={MapPinOff}
      title="Page not found"
      message="That link does not lead anywhere."
      action={
        <Link to="/" className="btn-primary">
          Back to dashboard
        </Link>
      }
    />
  )
}
