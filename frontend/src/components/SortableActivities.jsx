import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'

// A draggable list of planned activities. The builder shows a whole stop, the calendar shows
// one day of it, so the caller says which ids are on screen and what the new order means.
export default function SortableActivities({ ids, onReorder, children }) {
  // A few pixels of movement before a drag starts, so tapping the handle is not a drag.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  function onDragEnd({ active, over }) {
    if (!over || active.id === over.id) return
    onReorder(arrayMove(ids, ids.indexOf(active.id), ids.indexOf(over.id)))
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <ul className="space-y-2">{children}</ul>
      </SortableContext>
    </DndContext>
  )
}

export function SortableActivityRow({ id, label, children }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex flex-wrap items-center gap-2 rounded-lg bg-slate-50 px-2 py-2 ${
        isDragging ? 'relative z-10 shadow-md' : ''
      }`}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label={`Reorder ${label}`}
        className="cursor-grab touch-none rounded p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-600 active:cursor-grabbing"
      >
        <GripVertical size={16} />
      </button>
      {children}
    </li>
  )
}

// Moving one row by a step, for the arrow buttons that stand in for dragging on a touch screen.
export function shiftWithin(ids, id, direction) {
  const from = ids.indexOf(id)
  const to = from + direction
  if (to < 0 || to >= ids.length) return null
  return arrayMove(ids, from, to)
}
