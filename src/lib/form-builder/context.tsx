'use client'

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react'
import type { FormDefinition, FormField, FormRow, FormPage } from './types'
import { createEmptyDefinition } from './types'
import { ulid } from 'ulid'

interface BuilderState {
  definition: FormDefinition
  activePageId: string
  selectedFieldId: string | null
  isDirty: boolean
}

interface BuilderActions {
  // Field operations
  addField: (
    fieldType: string,
    defaultConfig: Partial<FormField>,
    pageId?: string
  ) => string
  updateField: (fieldId: string, updates: Partial<FormField>) => void
  removeField: (fieldId: string) => void
  selectField: (fieldId: string | null) => void

  // Row operations
  addRow: (
    pageId: string,
    fieldId: string,
    columnWidth?: number,
    afterRowId?: string
  ) => void
  removeRow: (pageId: string, rowId: string) => void
  moveRow: (pageId: string, fromIndex: number, toIndex: number) => void

  // Page operations
  setActivePage: (pageId: string) => void
  addPage: () => void
  removePage: (pageId: string) => void
  renamePage: (pageId: string, title: string) => void

  // Bulk operations
  setDefinition: (def: FormDefinition) => void
  getDefinitionJSON: () => string
}

type BuilderContextType = BuilderState & BuilderActions

const BuilderContext = createContext<BuilderContextType | null>(null)

export function BuilderProvider({
  initialDefinition,
  children,
}: {
  initialDefinition?: FormDefinition
  children: ReactNode
}) {
  const initial = initialDefinition || createEmptyDefinition()
  const [definition, setDef] = useState<FormDefinition>(initial)
  const [activePageId, setActivePage] = useState(
    initial.pages[0]?.id || 'page_1'
  )
  const [selectedFieldId, selectField] = useState<string | null>(null)
  const [isDirty, setDirty] = useState(false)

  const updateDefinition = useCallback(
    (updater: (prev: FormDefinition) => FormDefinition) => {
      setDef((prev) => {
        const next = updater(prev)
        setDirty(true)
        return next
      })
    },
    []
  )

  const addField = useCallback(
    (
      fieldType: string,
      defaultConfig: Partial<FormField>,
      pageId?: string
    ): string => {
      const fieldId = `field_${ulid().toLowerCase().slice(-8)}`
      const targetPageId = pageId || activePageId
      const rowId = `row_${ulid().toLowerCase().slice(-8)}`

      updateDefinition((prev) => ({
        ...prev,
        fields: {
          ...prev.fields,
          [fieldId]: {
            type: fieldType,
            label: defaultConfig.label || 'New Field',
            ...defaultConfig,
          },
        },
        pages: prev.pages.map((p) =>
          p.id === targetPageId
            ? {
                ...p,
                rows: [
                  ...p.rows,
                  { id: rowId, columns: [{ width: 12, fieldId }] },
                ],
              }
            : p
        ),
      }))

      selectField(fieldId)
      return fieldId
    },
    [activePageId, updateDefinition]
  )

  const updateField = useCallback(
    (fieldId: string, updates: Partial<FormField>) => {
      updateDefinition((prev) => ({
        ...prev,
        fields: {
          ...prev.fields,
          [fieldId]: { ...prev.fields[fieldId], ...updates },
        },
      }))
    },
    [updateDefinition]
  )

  const removeField = useCallback(
    (fieldId: string) => {
      updateDefinition((prev) => {
        const { [fieldId]: _, ...remainingFields } = prev.fields
        return {
          ...prev,
          fields: remainingFields,
          pages: prev.pages.map((p) => ({
            ...p,
            rows: p.rows
              .map((r) => ({
                ...r,
                columns: r.columns.filter((c) => c.fieldId !== fieldId),
              }))
              .filter((r) => r.columns.length > 0),
          })),
          conditions: prev.conditions.filter(
            (c) =>
              !c.rules.some((r) => r.fieldId === fieldId) &&
              !c.actions.some((a) => a.targetFieldId === fieldId)
          ),
        }
      })
      selectField(null)
    },
    [updateDefinition]
  )

  const addRow = useCallback(
    (
      pageId: string,
      fieldId: string,
      columnWidth = 12,
      afterRowId?: string
    ) => {
      const rowId = `row_${ulid().toLowerCase().slice(-8)}`
      updateDefinition((prev) => ({
        ...prev,
        pages: prev.pages.map((p) => {
          if (p.id !== pageId) return p
          const newRow: FormRow = {
            id: rowId,
            columns: [{ width: columnWidth, fieldId }],
          }
          if (afterRowId) {
            const idx = p.rows.findIndex((r) => r.id === afterRowId)
            const rows = [...p.rows]
            rows.splice(idx + 1, 0, newRow)
            return { ...p, rows }
          }
          return { ...p, rows: [...p.rows, newRow] }
        }),
      }))
    },
    [updateDefinition]
  )

  const removeRow = useCallback(
    (pageId: string, rowId: string) => {
      updateDefinition((prev) => ({
        ...prev,
        pages: prev.pages.map((p) =>
          p.id === pageId
            ? { ...p, rows: p.rows.filter((r) => r.id !== rowId) }
            : p
        ),
      }))
    },
    [updateDefinition]
  )

  const moveRow = useCallback(
    (pageId: string, fromIndex: number, toIndex: number) => {
      updateDefinition((prev) => ({
        ...prev,
        pages: prev.pages.map((p) => {
          if (p.id !== pageId) return p
          const rows = [...p.rows]
          const [moved] = rows.splice(fromIndex, 1)
          rows.splice(toIndex, 0, moved)
          return { ...p, rows }
        }),
      }))
    },
    [updateDefinition]
  )

  const addPage = useCallback(() => {
    const pageId = `page_${ulid().toLowerCase().slice(-8)}`
    updateDefinition((prev) => ({
      ...prev,
      pages: [
        ...prev.pages,
        { id: pageId, title: `Page ${prev.pages.length + 1}`, rows: [] },
      ],
    }))
    setActivePage(pageId)
  }, [updateDefinition])

  const removePage = useCallback(
    (pageId: string) => {
      updateDefinition((prev) => {
        if (prev.pages.length <= 1) return prev
        const page = prev.pages.find((p) => p.id === pageId)
        const fieldIds =
          page?.rows.flatMap((r) => r.columns.map((c) => c.fieldId)) || []
        const fields = { ...prev.fields }
        fieldIds.forEach((id) => delete fields[id])
        const pages = prev.pages.filter((p) => p.id !== pageId)
        return { ...prev, pages, fields }
      })
      setActivePage((prev) => {
        const pages = definition.pages.filter((p) => p.id !== pageId)
        return pages[0]?.id || prev
      })
    },
    [updateDefinition, definition.pages]
  )

  const renamePage = useCallback(
    (pageId: string, title: string) => {
      updateDefinition((prev) => ({
        ...prev,
        pages: prev.pages.map((p) =>
          p.id === pageId ? { ...p, title } : p
        ),
      }))
    },
    [updateDefinition]
  )

  const setDefinition = useCallback((def: FormDefinition) => {
    setDef(def)
    setActivePage(def.pages[0]?.id || 'page_1')
    selectField(null)
    setDirty(false)
  }, [])

  const getDefinitionJSON = useCallback(
    () => JSON.stringify(definition),
    [definition]
  )

  return (
    <BuilderContext.Provider
      value={{
        definition,
        activePageId,
        selectedFieldId,
        isDirty,
        addField,
        updateField,
        removeField,
        selectField,
        addRow,
        removeRow,
        moveRow,
        setActivePage,
        addPage,
        removePage,
        renamePage,
        setDefinition,
        getDefinitionJSON,
      }}
    >
      {children}
    </BuilderContext.Provider>
  )
}

export function useBuilder() {
  const ctx = useContext(BuilderContext)
  if (!ctx) throw new Error('useBuilder must be used within BuilderProvider')
  return ctx
}
