'use client'

import { useDroppable } from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useBuilder } from '@/lib/form-builder/context'
import { CanvasField } from './canvas-field'
import { GripVertical } from 'lucide-react'
import { cn } from '@/lib/utils'

function SortableRow({ row, pageId }: { row: { id: string; columns: { width: number; fieldId: string }[] }; pageId: string }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: row.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-stretch gap-2 group/row',
        isDragging && 'opacity-50 z-10'
      )}
    >
      <button
        {...attributes}
        {...listeners}
        className="shrink-0 flex items-center px-0.5 text-muted-foreground/40 hover:text-muted-foreground cursor-grab active:cursor-grabbing opacity-0 group-hover/row:opacity-100 transition-opacity"
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <div className="flex-1 grid grid-cols-12 gap-2">
        {row.columns.map((col) => (
          <div key={col.fieldId} style={{ gridColumn: `span ${col.width}` }}>
            <CanvasField fieldId={col.fieldId} />
          </div>
        ))}
      </div>
    </div>
  )
}

export function Canvas() {
  const { definition, activePageId, selectField } = useBuilder()
  const activePage = definition.pages.find((p) => p.id === activePageId)

  const { setNodeRef, isOver } = useDroppable({
    id: 'canvas-drop-zone',
    data: { type: 'canvas' },
  })

  const rowIds = activePage?.rows.map((r) => r.id) || []

  function handleCanvasClick() {
    selectField(null)
  }

  if (!activePage) return null

  return (
    <section
      className="flex-1 bg-muted/5 p-6 overflow-y-auto"
      onClick={handleCanvasClick}
    >
      <div className="max-w-2xl mx-auto">
        {activePage.rows.length > 0 ? (
          <SortableContext items={rowIds} strategy={verticalListSortingStrategy}>
            <div className="space-y-1">
              {activePage.rows.map((row) => (
                <SortableRow key={row.id} row={row} pageId={activePageId} />
              ))}
            </div>
          </SortableContext>
        ) : null}

        {/* Drop zone for new fields */}
        <div
          ref={setNodeRef}
          className={cn(
            'mt-4 rounded-lg border-2 border-dashed p-8 text-center transition-colors',
            isOver
              ? 'border-blue-400 bg-blue-50/50'
              : activePage.rows.length === 0
                ? 'border-muted-foreground/20'
                : 'border-muted-foreground/10'
          )}
        >
          <p className="text-sm text-muted-foreground">
            {activePage.rows.length === 0
              ? 'Drag fields from the left panel'
              : 'Drop here to add a field'}
          </p>
        </div>
      </div>
    </section>
  )
}
