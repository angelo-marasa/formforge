'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import { BuilderProvider, useBuilder } from '@/lib/form-builder/context'
import { getFieldType } from '@/lib/form-builder/field-types'
import type { FormDefinition } from '@/lib/form-builder/types'
import { createEmptyDefinition } from '@/lib/form-builder/types'
import { FieldPalette } from '@/components/builder/field-palette'
import { PageTabs } from '@/components/builder/page-tabs'
import { Canvas } from '@/components/builder/canvas'
import { FieldSettings } from '@/components/builder/field-settings'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'

interface FormData {
  id: string
  name: string
  status: string
  definition: string | null
  clientId: string
}

export default function FormBuilderPage() {
  const params = useParams<{ id: string }>()
  const [form, setForm] = useState<FormData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/forms/${params.id}`)
      if (res.ok) {
        const data = await res.json()
        setForm(data)
      }
      setLoading(false)
    }
    load()
  }, [params.id])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!form) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">Form not found</p>
      </div>
    )
  }

  let initialDefinition: FormDefinition
  try {
    initialDefinition = form.definition ? JSON.parse(form.definition) : createEmptyDefinition()
  } catch {
    initialDefinition = createEmptyDefinition()
  }

  return (
    <BuilderProvider initialDefinition={initialDefinition}>
      <BuilderShell form={form} />
    </BuilderProvider>
  )
}

function BuilderShell({ form }: { form: FormData }) {
  const {
    definition,
    activePageId,
    isDirty,
    addField,
    moveRow,
    getDefinitionJSON,
  } = useBuilder()

  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [dragActiveId, setDragActiveId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  )

  const handleSave = useCallback(
    async (status?: 'draft' | 'published') => {
      setSaving(true)
      try {
        const body: Record<string, string> = { definition: getDefinitionJSON() }
        if (status) body.status = status
        await fetch(`/api/forms/${form.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
      } finally {
        setSaving(false)
      }
    },
    [form.id, getDefinitionJSON]
  )

  function handleDragStart(event: DragStartEvent) {
    setDragActiveId(String(event.active.id))
  }

  function handleDragEnd(event: DragEndEvent) {
    setDragActiveId(null)
    const { active, over } = event

    if (!over) return

    const activeData = active.data.current as Record<string, unknown> | undefined

    // Palette item dropped on canvas
    if (activeData?.type === 'palette-item' && over.id === 'canvas-drop-zone') {
      const fieldTypeStr = activeData.fieldType as string
      const fieldTypeDef = getFieldType(fieldTypeStr)
      if (fieldTypeDef) {
        addField(fieldTypeStr, fieldTypeDef.defaultConfig, activePageId)
      }
      return
    }

    // Row reordering within canvas
    if (active.id !== over.id) {
      const activePage = definition.pages.find((p) => p.id === activePageId)
      if (!activePage) return
      const oldIndex = activePage.rows.findIndex((r) => r.id === active.id)
      const newIndex = activePage.rows.findIndex((r) => r.id === over.id)
      if (oldIndex !== -1 && newIndex !== -1) {
        moveRow(activePageId, oldIndex, newIndex)
      }
    }
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col h-screen">
        {/* Top bar */}
        <header className="h-14 border-b flex items-center justify-between px-4 shrink-0">
          <div className="flex items-center gap-3">
            <Link href="/admin/forms">
              <Button variant="ghost" size="sm">
                &larr; Back
              </Button>
            </Link>
            <div>
              <span className="font-semibold">{form.name}</span>
              <span className="text-xs text-muted-foreground ml-2 capitalize">
                {form.status}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSave('draft')}
              disabled={saving}
            >
              {saving ? (
                <Loader2 className="h-3 w-3 animate-spin mr-1" />
              ) : null}
              Save Draft
            </Button>
            <Button
              size="sm"
              onClick={() => handleSave('published')}
              disabled={saving}
            >
              Publish
            </Button>
          </div>
        </header>

        {/* Three column layout */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left: Field Palette */}
          <FieldPalette />

          {/* Center: Page Tabs + Canvas */}
          <div className="flex flex-col flex-1 overflow-hidden">
            <PageTabs />
            <Canvas />
          </div>

          {/* Right: Field Settings */}
          <FieldSettings />
        </div>
      </div>

      <DragOverlay>
        {dragActiveId ? (
          <div className="px-3 py-2 rounded-md text-sm bg-background border shadow-lg opacity-80">
            Dragging...
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
