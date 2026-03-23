'use client'

import { useBuilder } from '@/lib/form-builder/context'
import { getFieldType } from '@/lib/form-builder/field-types'
import * as Icons from 'lucide-react'
import { cn } from '@/lib/utils'

interface CanvasFieldProps {
  fieldId: string
}

const IconMap = Icons as unknown as Record<string, React.ComponentType<{ className?: string }>>

export function CanvasField({ fieldId }: CanvasFieldProps) {
  const { definition, selectedFieldId, selectField, removeField } = useBuilder()
  const field = definition.fields[fieldId]
  if (!field) return null

  const fieldType = getFieldType(field.type)
  const isSelected = selectedFieldId === fieldId
  const IconComponent = fieldType ? IconMap[fieldType.icon] : null
  const isLayout = fieldType?.category === 'layout'

  function handleClick(e: React.MouseEvent) {
    e.stopPropagation()
    selectField(fieldId)
  }

  function handleDelete(e: React.MouseEvent) {
    e.stopPropagation()
    removeField(fieldId)
  }

  // Layout type renderings
  if (field.type === 'divider') {
    return (
      <div
        onClick={handleClick}
        className={cn(
          'group relative py-3 px-4 rounded-md border cursor-pointer transition-colors',
          isSelected
            ? 'border-blue-500 bg-blue-50/50'
            : 'border-transparent hover:border-muted-foreground/20 hover:bg-muted/30'
        )}
      >
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
          {IconComponent && <IconComponent className="h-3.5 w-3.5" />}
          <span>Section Divider</span>
        </div>
        <hr className="border-muted-foreground/30" />
        <button
          onClick={handleDelete}
          className="absolute top-1 right-1 p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Icons.X className="h-3.5 w-3.5" />
        </button>
      </div>
    )
  }

  if (field.type === 'html') {
    return (
      <div
        onClick={handleClick}
        className={cn(
          'group relative py-3 px-4 rounded-md border cursor-pointer transition-colors',
          isSelected
            ? 'border-blue-500 bg-blue-50/50'
            : 'border-transparent hover:border-muted-foreground/20 hover:bg-muted/30'
        )}
      >
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
          {IconComponent && <IconComponent className="h-3.5 w-3.5" />}
          <span>HTML Block</span>
        </div>
        <div className="text-sm text-muted-foreground italic">
          {field.htmlContent ? 'Custom HTML content' : 'Empty HTML block'}
        </div>
        <button
          onClick={handleDelete}
          className="absolute top-1 right-1 p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Icons.X className="h-3.5 w-3.5" />
        </button>
      </div>
    )
  }

  if (field.type === 'page_break') {
    return (
      <div
        onClick={handleClick}
        className={cn(
          'group relative py-3 px-4 rounded-md border cursor-pointer transition-colors',
          isSelected
            ? 'border-blue-500 bg-blue-50/50'
            : 'border-transparent hover:border-muted-foreground/20 hover:bg-muted/30'
        )}
      >
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {IconComponent && <IconComponent className="h-3.5 w-3.5" />}
          <span className="flex-1">Page Break</span>
          <span className="border-t border-dashed border-muted-foreground/40 flex-1" />
        </div>
        <button
          onClick={handleDelete}
          className="absolute top-1 right-1 p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Icons.X className="h-3.5 w-3.5" />
        </button>
      </div>
    )
  }

  // Standard field rendering
  return (
    <div
      onClick={handleClick}
      className={cn(
        'group relative py-3 px-4 rounded-md border cursor-pointer transition-colors',
        isSelected
          ? 'border-blue-500 bg-blue-50/50'
          : 'border-transparent hover:border-muted-foreground/20 hover:bg-muted/30'
      )}
    >
      <div className="flex items-center gap-2 mb-1.5">
        {IconComponent && (
          <IconComponent className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        )}
        <span className="text-sm font-medium">
          {field.label}
          {field.required && <span className="text-destructive ml-0.5">*</span>}
        </span>
        <span className="text-[10px] uppercase text-muted-foreground ml-auto">
          {fieldType?.label || field.type}
        </span>
      </div>

      {/* Field preview */}
      <FieldPreview field={field} />

      <button
        onClick={handleDelete}
        className="absolute top-1 right-1 p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <Icons.X className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}

function FieldPreview({ field }: { field: { type: string; placeholder?: string; options?: { label: string; value: string }[] } }) {
  switch (field.type) {
    case 'text':
    case 'email':
    case 'phone':
    case 'number':
      return (
        <div className="h-8 rounded border bg-muted/30 px-2 flex items-center text-xs text-muted-foreground">
          {field.placeholder || 'Enter value...'}
        </div>
      )
    case 'textarea':
      return (
        <div className="h-14 rounded border bg-muted/30 px-2 pt-1.5 text-xs text-muted-foreground">
          {field.placeholder || 'Enter text...'}
        </div>
      )
    case 'select':
      return (
        <div className="h-8 rounded border bg-muted/30 px-2 flex items-center justify-between text-xs text-muted-foreground">
          <span>Select an option...</span>
          <Icons.ChevronDown className="h-3 w-3" />
        </div>
      )
    case 'multi_select':
      return (
        <div className="h-8 rounded border bg-muted/30 px-2 flex items-center text-xs text-muted-foreground">
          Select options...
        </div>
      )
    case 'radio':
      return (
        <div className="space-y-1">
          {(field.options || []).slice(0, 3).map((opt) => (
            <div key={opt.value} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <div className="h-3 w-3 rounded-full border border-muted-foreground/40" />
              <span>{opt.label}</span>
            </div>
          ))}
        </div>
      )
    case 'checkbox':
      return (
        <div className="space-y-1">
          {(field.options || []).slice(0, 3).map((opt) => (
            <div key={opt.value} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <div className="h-3 w-3 rounded-sm border border-muted-foreground/40" />
              <span>{opt.label}</span>
            </div>
          ))}
        </div>
      )
    case 'file':
      return (
        <div className="h-8 rounded border border-dashed bg-muted/30 px-2 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Icons.Upload className="h-3 w-3" />
          <span>Choose file...</span>
        </div>
      )
    case 'date':
      return (
        <div className="h-8 rounded border bg-muted/30 px-2 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Icons.Calendar className="h-3 w-3" />
          <span>Pick a date...</span>
        </div>
      )
    case 'hidden':
      return (
        <div className="h-6 flex items-center text-xs text-muted-foreground italic">
          Hidden from user
        </div>
      )
    default:
      return null
  }
}
