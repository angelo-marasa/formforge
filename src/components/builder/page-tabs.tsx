'use client'

import { useState, useRef, useEffect } from 'react'
import { useBuilder } from '@/lib/form-builder/context'
import { cn } from '@/lib/utils'
import { Plus, X } from 'lucide-react'

export function PageTabs() {
  const { definition, activePageId, setActivePage, addPage, removePage, renamePage } = useBuilder()
  const [editingPageId, setEditingPageId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editingPageId && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editingPageId])

  function handleDoubleClick(pageId: string, currentTitle: string) {
    setEditingPageId(pageId)
    setEditValue(currentTitle)
  }

  function commitRename() {
    if (editingPageId && editValue.trim()) {
      renamePage(editingPageId, editValue.trim())
    }
    setEditingPageId(null)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') commitRename()
    if (e.key === 'Escape') setEditingPageId(null)
  }

  function handleRemovePage(e: React.MouseEvent, pageId: string) {
    e.stopPropagation()
    if (definition.pages.length <= 1) return
    if (confirm('Delete this page and all its fields?')) {
      removePage(pageId)
    }
  }

  return (
    <div className="flex items-center gap-1 border-b px-2 bg-muted/20 overflow-x-auto">
      {definition.pages.map((page) => (
        <div
          key={page.id}
          onClick={() => setActivePage(page.id)}
          onDoubleClick={() => handleDoubleClick(page.id, page.title)}
          className={cn(
            'group flex items-center gap-1.5 px-3 py-2 text-sm cursor-pointer border-b-2 transition-colors shrink-0',
            page.id === activePageId
              ? 'border-primary text-foreground font-medium'
              : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30'
          )}
        >
          {editingPageId === page.id ? (
            <input
              ref={inputRef}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={commitRename}
              onKeyDown={handleKeyDown}
              className="w-24 bg-background border rounded px-1 py-0.5 text-sm outline-none focus:ring-1 focus:ring-primary"
            />
          ) : (
            <span>{page.title}</span>
          )}
          {definition.pages.length > 1 && (
            <button
              onClick={(e) => handleRemovePage(e, page.id)}
              className="p-0.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      ))}
      <button
        onClick={addPage}
        className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0"
        title="Add page"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  )
}
