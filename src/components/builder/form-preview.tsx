'use client'

import { useState } from 'react'
import { useBuilder } from '@/lib/form-builder/context'
import type { FormDefinition, FormField, FormPage } from '@/lib/form-builder/types'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Eye, Monitor, Smartphone } from 'lucide-react'

interface StyleConfig {
  primaryColor?: string
  backgroundColor?: string
  textColor?: string
  borderRadius?: string
  fontFamily?: string
}

function resolveRadius(val?: string): string {
  switch (val) {
    case 'none': return '0px'
    case 'small': return '4px'
    case 'large': return '12px'
    default: return '6px'
  }
}

function resolveFont(val?: string): string {
  switch (val) {
    case 'serif': return 'Georgia, "Times New Roman", serif'
    case 'monospace': return '"SF Mono", "Fira Code", monospace'
    default: return 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  }
}

function PreviewField({ field, fieldId }: { field: FormField; fieldId: string }) {
  if (field.type === 'html') {
    return <div className="ff-preview-html" dangerouslySetInnerHTML={{ __html: field.htmlContent || '' }} />
  }

  if (field.type === 'divider' || field.type === 'section_divider') {
    return (
      <div>
        {field.label && <div style={{ fontWeight: 600, fontSize: '0.875em', marginBottom: 8 }}>{field.label}</div>}
        <hr style={{ border: 'none', borderTop: '1px solid var(--ff-border)', margin: '16px 0' }} />
      </div>
    )
  }

  if (field.type === 'hidden') return null

  const label = field.label ? (
    <label style={{ display: 'block', fontSize: '0.875em', fontWeight: 500, marginBottom: 4 }}>
      {field.label}
      {field.required && <span style={{ color: '#dc2626', marginLeft: 2 }}> *</span>}
    </label>
  ) : null

  const inputStyle: React.CSSProperties = {
    display: 'block',
    width: '100%',
    padding: '8px 10px',
    fontSize: '0.9375em',
    fontFamily: 'inherit',
    border: '1px solid var(--ff-border)',
    borderRadius: 'var(--ff-radius)',
    background: '#fff',
    color: 'var(--ff-text)',
    outline: 'none',
    boxSizing: 'border-box' as const,
  }

  let input: React.ReactNode = null

  switch (field.type) {
    case 'textarea':
      input = (
        <textarea
          readOnly
          placeholder={field.placeholder || ''}
          style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }}
        />
      )
      break

    case 'select':
      input = (
        <select style={{ ...inputStyle, appearance: 'auto' }} disabled>
          <option>{field.placeholder || 'Select...'}</option>
          {field.options?.map((o, i) => (
            <option key={i} value={o.value}>{o.label}</option>
          ))}
        </select>
      )
      break

    case 'multi_select':
      input = (
        <select style={{ ...inputStyle, appearance: 'auto', minHeight: 60 }} multiple disabled>
          {field.options?.map((o, i) => (
            <option key={i} value={o.value}>{o.label}</option>
          ))}
        </select>
      )
      break

    case 'radio':
      input = (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {field.options?.map((o, i) => (
            <label key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.9375em', cursor: 'default' }}>
              <input type="radio" name={`preview-${fieldId}`} disabled style={{ margin: 0, accentColor: 'var(--ff-primary)' }} />
              {o.label}
            </label>
          ))}
        </div>
      )
      break

    case 'checkbox':
      input = (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {field.options?.map((o, i) => (
            <label key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.9375em', cursor: 'default' }}>
              <input type="checkbox" disabled style={{ margin: 0, accentColor: 'var(--ff-primary)' }} />
              {o.label}
            </label>
          ))}
        </div>
      )
      break

    case 'file':
      input = <input type="file" disabled style={{ fontSize: '0.875em' }} />
      break

    case 'date':
      input = <input type="date" disabled style={inputStyle} />
      break

    default: {
      let inputType = 'text'
      if (field.type === 'email') inputType = 'email'
      else if (field.type === 'number') inputType = 'number'
      else if (field.type === 'phone') inputType = 'tel'
      input = (
        <input
          type={inputType}
          readOnly
          placeholder={field.placeholder || ''}
          style={inputStyle}
        />
      )
      break
    }
  }

  return (
    <div style={{ marginBottom: 4 }}>
      {label}
      {input}
    </div>
  )
}

function PreviewPage({
  page,
  fields,
  pageIndex,
  totalPages,
  onNext,
  onPrev,
  styleConfig,
}: {
  page: FormPage
  fields: Record<string, FormField>
  pageIndex: number
  totalPages: number
  onNext: () => void
  onPrev: () => void
  styleConfig?: StyleConfig | null
}) {
  const isMulti = totalPages > 1
  const isLast = pageIndex === totalPages - 1

  const primary = styleConfig?.primaryColor || '#2563eb'
  const primaryHover = primary // simplified

  return (
    <div>
      {isMulti && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, fontSize: '0.8em', color: '#6b7280' }}>
          <span>Step {pageIndex + 1} of {totalPages}</span>
          <div style={{ flex: 1, height: 4, background: '#e5e7eb', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ height: '100%', background: primary, borderRadius: 2, width: `${Math.round(((pageIndex + 1) / totalPages) * 100)}%`, transition: 'width 0.3s' }} />
          </div>
        </div>
      )}

      {page.title && (
        <div style={{ fontSize: '1.25em', fontWeight: 600, margin: '0 0 16px 0' }}>{page.title}</div>
      )}

      {page.rows.map((row) => (
        <div key={row.id} style={{ display: 'flex', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
          {row.columns.map((col) => {
            const field = fields[col.fieldId]
            if (!field) return null
            const widthPct = `${(col.width / 12) * 100}%`
            return (
              <div key={col.fieldId} style={{ flex: `0 0 calc(${widthPct} - 6px)`, maxWidth: `calc(${widthPct} - 6px)`, minWidth: 0 }}>
                <PreviewField field={field} fieldId={col.fieldId} />
              </div>
            )
          })}
        </div>
      ))}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, gap: 8 }}>
        {isMulti && pageIndex > 0 ? (
          <button
            type="button"
            onClick={onPrev}
            style={{ padding: '10px 20px', fontSize: '0.9375em', fontWeight: 500, border: 'none', borderRadius: 'var(--ff-radius)', cursor: 'pointer', background: '#e5e7eb', color: '#374151' }}
          >
            Back
          </button>
        ) : <span />}
        <button
          type="button"
          onClick={isLast ? undefined : onNext}
          style={{ padding: '10px 20px', fontSize: '0.9375em', fontWeight: 500, border: 'none', borderRadius: 'var(--ff-radius)', cursor: 'pointer', background: primary, color: '#fff' }}
        >
          {isLast ? 'Submit' : 'Next'}
        </button>
      </div>
    </div>
  )
}

export function FormPreview({ styleConfig }: { styleConfig?: StyleConfig | null }) {
  const { definition } = useBuilder()
  const [open, setOpen] = useState(false)
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop')
  const [currentPage, setCurrentPage] = useState(0)

  const primary = styleConfig?.primaryColor || '#3b82f6'
  const bg = styleConfig?.backgroundColor || '#ffffff'
  const text = styleConfig?.textColor || '#1f2937'
  const radius = resolveRadius(styleConfig?.borderRadius)
  const font = resolveFont(styleConfig?.fontFamily)

  const containerWidth = viewMode === 'mobile' ? 375 : 640

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); setCurrentPage(0) }}>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        <Eye className="h-3 w-3 mr-1" />
        Preview
      </DialogTrigger>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between pr-8">
            <DialogTitle>Form Preview</DialogTitle>
            <div className="flex items-center gap-1 border rounded-lg p-0.5">
              <button
                type="button"
                onClick={() => setViewMode('desktop')}
                className={`p-1.5 rounded ${viewMode === 'desktop' ? 'bg-muted' : ''}`}
                title="Desktop"
              >
                <Monitor className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('mobile')}
                className={`p-1.5 rounded ${viewMode === 'mobile' ? 'bg-muted' : ''}`}
                title="Mobile"
              >
                <Smartphone className="h-4 w-4" />
              </button>
            </div>
          </div>
        </DialogHeader>
        <div className="flex-1 overflow-auto flex justify-center p-4 bg-muted/30 rounded-lg">
          <div
            style={{
              width: containerWidth,
              maxWidth: '100%',
              background: bg,
              color: text,
              fontFamily: font,
              fontSize: 15,
              lineHeight: 1.5,
              padding: 24,
              borderRadius: 8,
              border: '1px solid #e5e7eb',
              boxSizing: 'border-box',
              ['--ff-primary' as string]: primary,
              ['--ff-bg' as string]: bg,
              ['--ff-text' as string]: text,
              ['--ff-radius' as string]: radius,
              ['--ff-font' as string]: font,
              ['--ff-border' as string]: '#d1d5db',
            }}
          >
            {definition.pages.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 24, color: '#6b7280' }}>
                This form has no content yet.
              </div>
            ) : (
              <PreviewPage
                page={definition.pages[currentPage] || definition.pages[0]}
                fields={definition.fields}
                pageIndex={currentPage}
                totalPages={definition.pages.length}
                styleConfig={styleConfig}
                onNext={() => setCurrentPage((p) => Math.min(p + 1, definition.pages.length - 1))}
                onPrev={() => setCurrentPage((p) => Math.max(p - 1, 0))}
              />
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
