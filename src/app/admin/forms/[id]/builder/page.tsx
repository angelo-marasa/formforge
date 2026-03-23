'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
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
import { ConditionEditor } from '@/components/builder/condition-editor'
import { Loader2, Check, Copy, Circle, Zap } from 'lucide-react'

interface FormData {
  id: string
  name: string
  status: string
  definition: string | null
  clientId: string
  embedKey: string
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

function BuilderShell({ form: initialForm }: { form: FormData }) {
  const {
    definition,
    activePageId,
    isDirty,
    addField,
    moveRow,
    getDefinitionJSON,
    markClean,
  } = useBuilder()

  const [form, setForm] = useState(initialForm)
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [saveFlash, setSaveFlash] = useState(false)
  const [showEmbed, setShowEmbed] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showConditions, setShowConditions] = useState(false)
  const [dragActiveId, setDragActiveId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  )

  const embedSnippet = `<div id="ff-${form.embedKey}"></div><script src="https://formforge.io/embed.js" data-form="${form.embedKey}"></script>`

  const handleSaveDraft = useCallback(async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/forms/${form.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ definition: getDefinitionJSON() }),
      })
      if (res.ok) {
        markClean()
        setSaveFlash(true)
        setTimeout(() => setSaveFlash(false), 2000)
      }
    } finally {
      setSaving(false)
    }
  }, [form.id, getDefinitionJSON, markClean])

  const handlePublish = useCallback(async () => {
    setPublishing(true)
    try {
      const res = await fetch(`/api/forms/${form.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          definition: getDefinitionJSON(),
          status: 'published',
        }),
      })
      if (res.ok) {
        const updated = await res.json()
        setForm((prev) => ({ ...prev, status: updated.status || 'published' }))
        markClean()
        setShowEmbed(true)
      }
    } finally {
      setPublishing(false)
    }
  }, [form.id, getDefinitionJSON, markClean])

  const copyEmbed = useCallback(() => {
    navigator.clipboard.writeText(embedSnippet)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [embedSnippet])

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
              variant={showConditions ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowConditions(!showConditions)}
            >
              <Zap className="h-3 w-3 mr-1" />
              Conditions
              {definition.conditions.length > 0 && (
                <span className="ml-1 text-xs opacity-70">
                  ({definition.conditions.length})
                </span>
              )}
            </Button>
            {saveFlash && (
              <span className="text-xs text-green-600 flex items-center gap-1">
                <Check className="h-3 w-3" /> Saved
              </span>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleSaveDraft}
              disabled={saving || publishing}
            >
              {saving ? (
                <Loader2 className="h-3 w-3 animate-spin mr-1" />
              ) : null}
              {isDirty && !saving && (
                <Circle className="h-2 w-2 fill-orange-400 text-orange-400 mr-1" />
              )}
              {saving ? 'Saving...' : 'Save Draft'}
            </Button>
            <Button
              size="sm"
              onClick={handlePublish}
              disabled={saving || publishing}
            >
              {publishing ? (
                <Loader2 className="h-3 w-3 animate-spin mr-1" />
              ) : null}
              {publishing ? 'Publishing...' : 'Publish'}
            </Button>
          </div>
        </header>

        {/* Embed code banner */}
        {showEmbed && form.status === 'published' && (
          <div className="border-b bg-green-50 dark:bg-green-950/30 px-4 py-3 flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-green-800 dark:text-green-200 mb-1">
                Form published. Embed it on your site:
              </p>
              <code className="text-xs bg-white dark:bg-black/20 border rounded px-2 py-1 block truncate">
                {embedSnippet}
              </code>
            </div>
            <div className="flex items-center gap-2 ml-4 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={copyEmbed}
              >
                {copied ? (
                  <><Check className="h-3 w-3 mr-1" /> Copied</>
                ) : (
                  <><Copy className="h-3 w-3 mr-1" /> Copy</>
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowEmbed(false)}
              >
                Dismiss
              </Button>
            </div>
          </div>
        )}

        {/* Three column layout */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left: Field Palette */}
          <FieldPalette />

          {/* Center: Page Tabs + Canvas */}
          <div className="flex flex-col flex-1 overflow-hidden">
            <PageTabs />
            <Canvas />
          </div>

          {/* Right: Field Settings or Conditions Panel */}
          {showConditions ? (
            <aside className="w-80 border-l bg-muted/20 overflow-hidden flex flex-col">
              <ConditionEditor onClose={() => setShowConditions(false)} />
            </aside>
          ) : (
            <FieldSettings />
          )}
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
