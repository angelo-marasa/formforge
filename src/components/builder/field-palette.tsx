'use client'

import { useDraggable } from '@dnd-kit/core'
import { FIELD_TYPES, type FieldTypeDefinition } from '@/lib/form-builder/field-types'
import * as Icons from 'lucide-react'
import { cn } from '@/lib/utils'

function PaletteItem({ fieldType }: { fieldType: FieldTypeDefinition }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette-${fieldType.type}`,
    data: { type: 'palette-item', fieldType: fieldType.type },
  })

  const IconComponent = (Icons as Record<string, React.ComponentType<{ className?: string }>>)[fieldType.icon]

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={cn(
        'flex items-center gap-2 px-3 py-2 rounded-md text-sm cursor-grab active:cursor-grabbing border bg-background hover:bg-muted transition-colors',
        isDragging && 'opacity-50'
      )}
    >
      {IconComponent && <IconComponent className="h-4 w-4 text-muted-foreground shrink-0" />}
      <span>{fieldType.label}</span>
    </div>
  )
}

const categories = [
  { key: 'basic', label: 'Basic Fields' },
  { key: 'choice', label: 'Choice Fields' },
  { key: 'advanced', label: 'Advanced' },
  { key: 'layout', label: 'Layout' },
] as const

export function FieldPalette() {
  return (
    <aside className="w-56 border-r bg-muted/20 p-3 overflow-y-auto">
      {categories.map((cat) => {
        const fields = FIELD_TYPES.filter(f => f.category === cat.key)
        return (
          <div key={cat.key} className="mb-4">
            <h3 className="text-xs font-semibold uppercase text-muted-foreground mb-2 px-1">
              {cat.label}
            </h3>
            <div className="space-y-1">
              {fields.map((ft) => (
                <PaletteItem key={ft.type} fieldType={ft} />
              ))}
            </div>
          </div>
        )
      })}
    </aside>
  )
}
