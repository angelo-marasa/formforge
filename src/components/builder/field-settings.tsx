'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useBuilder } from '@/lib/form-builder/context'
import { getFieldType } from '@/lib/form-builder/field-types'
import type { FormField, FieldOption, FieldValidation } from '@/lib/form-builder/types'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Trash2, Plus, GripVertical, ChevronDown, ChevronRight } from 'lucide-react'

const LAYOUT_TYPES = ['html', 'divider', 'page_break']
const CHOICE_TYPES = ['select', 'multi_select', 'radio', 'checkbox']
const TEXT_TYPES = ['text', 'textarea', 'email', 'phone']

function useDebounced<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debounced
}

export function FieldSettings() {
  const { selectedFieldId, definition, updateField, removeField, selectField } = useBuilder()

  if (!selectedFieldId || !definition.fields[selectedFieldId]) {
    return (
      <aside className="w-72 border-l bg-muted/20 p-4 overflow-y-auto">
        <h3 className="text-xs font-semibold uppercase text-muted-foreground mb-3">
          Field Settings
        </h3>
        <p className="text-sm text-muted-foreground">
          Select a field to configure
        </p>
      </aside>
    )
  }

  return (
    <aside className="w-72 border-l bg-muted/20 p-4 overflow-y-auto">
      <h3 className="text-xs font-semibold uppercase text-muted-foreground mb-3">
        Field Settings
      </h3>
      <FieldSettingsForm
        key={selectedFieldId}
        fieldId={selectedFieldId}
        field={definition.fields[selectedFieldId]}
        updateField={updateField}
        removeField={removeField}
        selectField={selectField}
      />
    </aside>
  )
}

function FieldSettingsForm({
  fieldId,
  field,
  updateField,
  removeField,
  selectField,
}: {
  fieldId: string
  field: FormField
  updateField: (id: string, updates: Partial<FormField>) => void
  removeField: (id: string) => void
  selectField: (id: string | null) => void
}) {
  const [label, setLabel] = useState(field.label)
  const [placeholder, setPlaceholder] = useState(field.placeholder || '')
  const [required, setRequired] = useState(field.required || false)
  const [cssClass, setCssClass] = useState(field.cssClass || '')
  const [htmlContent, setHtmlContent] = useState(field.htmlContent || '')
  const [defaultValue, setDefaultValue] = useState(field.defaultValue || '')
  const [options, setOptions] = useState<FieldOption[]>(field.options || [])
  const [validation, setValidation] = useState<FieldValidation>(field.validation || {})
  const [showValidation, setShowValidation] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const isLayout = LAYOUT_TYPES.includes(field.type)
  const isChoice = CHOICE_TYPES.includes(field.type)
  const isText = TEXT_TYPES.includes(field.type)
  const isNumber = field.type === 'number'
  const isHtml = field.type === 'html'
  const isHidden = field.type === 'hidden'

  const fieldTypeDef = getFieldType(field.type)

  // Debounced values for real-time preview
  const debouncedLabel = useDebounced(label, 150)
  const debouncedPlaceholder = useDebounced(placeholder, 150)
  const debouncedCssClass = useDebounced(cssClass, 150)
  const debouncedHtmlContent = useDebounced(htmlContent, 150)
  const debouncedDefaultValue = useDebounced(defaultValue, 150)
  const debouncedOptions = useDebounced(options, 200)
  const debouncedValidation = useDebounced(validation, 200)

  // Push debounced changes to context
  const isInitialMount = useRef(true)

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false
      return
    }
    const updates: Partial<FormField> = {
      label: debouncedLabel,
      placeholder: debouncedPlaceholder || undefined,
      required,
      cssClass: debouncedCssClass || undefined,
    }
    if (isHtml) updates.htmlContent = debouncedHtmlContent
    if (isHidden) updates.defaultValue = debouncedDefaultValue
    if (isChoice) updates.options = debouncedOptions
    if (!isLayout) {
      const cleanValidation = Object.fromEntries(
        Object.entries(debouncedValidation).filter(([, v]) => v !== undefined && v !== '' && v !== null)
      )
      updates.validation = Object.keys(cleanValidation).length > 0 ? cleanValidation as FieldValidation : undefined
    }
    updateField(fieldId, updates)
  }, [
    fieldId,
    debouncedLabel,
    debouncedPlaceholder,
    required,
    debouncedCssClass,
    debouncedHtmlContent,
    debouncedDefaultValue,
    debouncedOptions,
    debouncedValidation,
    isHtml,
    isHidden,
    isChoice,
    isLayout,
    updateField,
  ])

  // Also push required immediately (no debounce needed for checkbox)
  const requiredRef = useRef(required)
  useEffect(() => {
    if (requiredRef.current !== required) {
      requiredRef.current = required
    }
  }, [required])

  const addOption = useCallback(() => {
    const idx = options.length + 1
    setOptions([...options, { label: `Option ${idx}`, value: `option_${idx}` }])
  }, [options])

  const removeOption = useCallback(
    (index: number) => {
      setOptions(options.filter((_, i) => i !== index))
    },
    [options]
  )

  const updateOption = useCallback(
    (index: number, key: 'label' | 'value', val: string) => {
      setOptions(
        options.map((opt, i) => (i === index ? { ...opt, [key]: val } : opt))
      )
    },
    [options]
  )

  const moveOption = useCallback(
    (index: number, direction: -1 | 1) => {
      const newIndex = index + direction
      if (newIndex < 0 || newIndex >= options.length) return
      const newOptions = [...options]
      const [moved] = newOptions.splice(index, 1)
      newOptions.splice(newIndex, 0, moved)
      setOptions(newOptions)
    },
    [options]
  )

  const updateValidationField = useCallback(
    (key: keyof FieldValidation, val: string) => {
      setValidation((prev) => {
        const next = { ...prev }
        if (val === '' || val === undefined) {
          delete next[key]
        } else if (key === 'minLength' || key === 'maxLength' || key === 'min' || key === 'max') {
          const num = Number(val)
          if (!isNaN(num)) (next as Record<string, unknown>)[key] = num
        } else {
          (next as Record<string, unknown>)[key] = val
        }
        return next
      })
    },
    []
  )

  const handleDelete = useCallback(() => {
    if (!confirmDelete) {
      setConfirmDelete(true)
      return
    }
    removeField(fieldId)
  }, [confirmDelete, fieldId, removeField])

  return (
    <div className="space-y-4">
      {/* Field type badge */}
      <div>
        <Badge variant="secondary" className="text-xs">
          {fieldTypeDef?.label || field.type}
        </Badge>
      </div>

      {/* Label */}
      <div className="space-y-1.5">
        <Label htmlFor="field-label" className="text-xs">
          Label
        </Label>
        <Input
          id="field-label"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          className="h-8 text-sm"
        />
      </div>

      {/* Placeholder (not for layout types) */}
      {!isLayout && !isHidden && (
        <div className="space-y-1.5">
          <Label htmlFor="field-placeholder" className="text-xs">
            Placeholder
          </Label>
          <Input
            id="field-placeholder"
            value={placeholder}
            onChange={(e) => setPlaceholder(e.target.value)}
            className="h-8 text-sm"
          />
        </div>
      )}

      {/* Required toggle (not for layout types) */}
      {!isLayout && (
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="field-required"
            checked={required}
            onChange={(e) => setRequired(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300"
          />
          <Label htmlFor="field-required" className="text-xs cursor-pointer">
            Required
          </Label>
        </div>
      )}

      {/* CSS Class */}
      <div className="space-y-1.5">
        <Label htmlFor="field-css" className="text-xs">
          CSS Class
        </Label>
        <Input
          id="field-css"
          value={cssClass}
          onChange={(e) => setCssClass(e.target.value)}
          placeholder="Optional"
          className="h-8 text-sm"
        />
      </div>

      {/* HTML Content (for html type) */}
      {isHtml && (
        <>
          <Separator />
          <div className="space-y-1.5">
            <Label htmlFor="field-html" className="text-xs">
              HTML Content
            </Label>
            <textarea
              id="field-html"
              value={htmlContent}
              onChange={(e) => setHtmlContent(e.target.value)}
              rows={5}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
        </>
      )}

      {/* Default Value (for hidden type) */}
      {isHidden && (
        <>
          <Separator />
          <div className="space-y-1.5">
            <Label htmlFor="field-default" className="text-xs">
              Default Value
            </Label>
            <Input
              id="field-default"
              value={defaultValue}
              onChange={(e) => setDefaultValue(e.target.value)}
              className="h-8 text-sm"
            />
          </div>
        </>
      )}

      {/* Options editor (for choice types) */}
      {isChoice && (
        <>
          <Separator />
          <div className="space-y-2">
            <Label className="text-xs">Options</Label>
            <div className="space-y-2">
              {options.map((opt, idx) => (
                <div key={idx} className="flex items-center gap-1">
                  <div className="flex flex-col gap-0.5">
                    <button
                      type="button"
                      onClick={() => moveOption(idx, -1)}
                      disabled={idx === 0}
                      className="text-muted-foreground hover:text-foreground disabled:opacity-30 p-0"
                      title="Move up"
                    >
                      <GripVertical className="h-3 w-3" />
                    </button>
                  </div>
                  <div className="flex-1 space-y-1">
                    <Input
                      value={opt.label}
                      onChange={(e) => updateOption(idx, 'label', e.target.value)}
                      placeholder="Label"
                      className="h-7 text-xs"
                    />
                    <Input
                      value={opt.value}
                      onChange={(e) => updateOption(idx, 'value', e.target.value)}
                      placeholder="Value"
                      className="h-7 text-xs"
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeOption(idx)}
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={addOption}
              className="w-full h-7 text-xs"
            >
              <Plus className="h-3 w-3 mr-1" />
              Add Option
            </Button>
          </div>
        </>
      )}

      {/* Validation section (not for layout types) */}
      {!isLayout && (
        <>
          <Separator />
          <button
            type="button"
            onClick={() => setShowValidation(!showValidation)}
            className="flex items-center gap-1 text-xs font-semibold uppercase text-muted-foreground hover:text-foreground w-full"
          >
            {showValidation ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
            Validation
          </button>

          {showValidation && (
            <div className="space-y-3">
              {/* Min/Max Length for text types */}
              {isText && (
                <>
                  <div className="space-y-1.5">
                    <Label htmlFor="val-minlength" className="text-xs">
                      Min Length
                    </Label>
                    <Input
                      id="val-minlength"
                      type="number"
                      value={validation.minLength ?? ''}
                      onChange={(e) =>
                        updateValidationField('minLength', e.target.value)
                      }
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="val-maxlength" className="text-xs">
                      Max Length
                    </Label>
                    <Input
                      id="val-maxlength"
                      type="number"
                      value={validation.maxLength ?? ''}
                      onChange={(e) =>
                        updateValidationField('maxLength', e.target.value)
                      }
                      className="h-8 text-sm"
                    />
                  </div>
                </>
              )}

              {/* Min/Max for number type */}
              {isNumber && (
                <>
                  <div className="space-y-1.5">
                    <Label htmlFor="val-min" className="text-xs">
                      Min
                    </Label>
                    <Input
                      id="val-min"
                      type="number"
                      value={validation.min ?? ''}
                      onChange={(e) =>
                        updateValidationField('min', e.target.value)
                      }
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="val-max" className="text-xs">
                      Max
                    </Label>
                    <Input
                      id="val-max"
                      type="number"
                      value={validation.max ?? ''}
                      onChange={(e) =>
                        updateValidationField('max', e.target.value)
                      }
                      className="h-8 text-sm"
                    />
                  </div>
                </>
              )}

              {/* Pattern */}
              <div className="space-y-1.5">
                <Label htmlFor="val-pattern" className="text-xs">
                  Pattern (regex)
                </Label>
                <Input
                  id="val-pattern"
                  value={validation.pattern ?? ''}
                  onChange={(e) =>
                    updateValidationField('pattern', e.target.value)
                  }
                  placeholder="e.g. ^[A-Z]+"
                  className="h-8 text-sm"
                />
              </div>

              {/* Custom error message */}
              <div className="space-y-1.5">
                <Label htmlFor="val-message" className="text-xs">
                  Custom Error Message
                </Label>
                <Input
                  id="val-message"
                  value={validation.customMessage ?? ''}
                  onChange={(e) =>
                    updateValidationField('customMessage', e.target.value)
                  }
                  placeholder="Please enter a valid value"
                  className="h-8 text-sm"
                />
              </div>
            </div>
          )}
        </>
      )}

      {/* Delete field */}
      <Separator />
      <Button
        variant="destructive"
        size="sm"
        onClick={handleDelete}
        className="w-full text-xs"
      >
        <Trash2 className="h-3 w-3 mr-1" />
        {confirmDelete ? 'Click again to confirm' : 'Delete Field'}
      </Button>
    </div>
  )
}
