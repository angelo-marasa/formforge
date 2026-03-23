'use client'

import { useBuilder } from '@/lib/form-builder/context'
import type {
  FormCondition,
  FormConditionRule,
  FormConditionAction,
} from '@/lib/form-builder/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Plus, Trash2, X } from 'lucide-react'

const OPERATORS: { value: FormConditionRule['operator']; label: string }[] = [
  { value: 'equals', label: 'Equals' },
  { value: 'notEquals', label: 'Not Equals' },
  { value: 'contains', label: 'Contains' },
  { value: 'notContains', label: 'Not Contains' },
  { value: 'greaterThan', label: 'Greater Than' },
  { value: 'lessThan', label: 'Less Than' },
  { value: 'isEmpty', label: 'Is Empty' },
  { value: 'isNotEmpty', label: 'Is Not Empty' },
]

const ACTION_TYPES: { value: FormConditionAction['type']; label: string }[] = [
  { value: 'show', label: 'Show Field' },
  { value: 'hide', label: 'Hide Field' },
  { value: 'setValue', label: 'Set Value' },
  { value: 'skipToPage', label: 'Skip to Page' },
]

const VALUE_HIDDEN_OPERATORS = ['isEmpty', 'isNotEmpty']

interface ConditionEditorProps {
  onClose?: () => void
  filterFieldId?: string
}

export function ConditionEditor({ onClose, filterFieldId }: ConditionEditorProps) {
  const {
    definition,
    addCondition,
    updateCondition,
    removeCondition,
  } = useBuilder()

  const fieldEntries = Object.entries(definition.fields)
  const pages = definition.pages

  const conditions = filterFieldId
    ? definition.conditions.filter(
        (c) =>
          c.actions.some(
            (a) => a.targetFieldId === filterFieldId
          ) ||
          c.rules.some((r) => r.fieldId === filterFieldId)
      )
    : definition.conditions

  const handleAddCondition = () => {
    addCondition()
  }

  const handleUpdateRule = (
    condition: FormCondition,
    ruleIndex: number,
    updates: Partial<FormConditionRule>
  ) => {
    const newRules = condition.rules.map((r, i) =>
      i === ruleIndex ? { ...r, ...updates } : r
    )
    updateCondition(condition.id, { rules: newRules })
  }

  const handleAddRule = (condition: FormCondition) => {
    updateCondition(condition.id, {
      rules: [...condition.rules, { fieldId: '', operator: 'equals', value: '' }],
    })
  }

  const handleRemoveRule = (condition: FormCondition, ruleIndex: number) => {
    if (condition.rules.length <= 1) return
    updateCondition(condition.id, {
      rules: condition.rules.filter((_, i) => i !== ruleIndex),
    })
  }

  const handleUpdateAction = (
    condition: FormCondition,
    actionIndex: number,
    updates: Partial<FormConditionAction>
  ) => {
    const newActions = condition.actions.map((a, i) =>
      i === actionIndex ? { ...a, ...updates } : a
    )
    updateCondition(condition.id, { actions: newActions })
  }

  const handleAddAction = (condition: FormCondition) => {
    updateCondition(condition.id, {
      actions: [...condition.actions, { type: 'show', targetFieldId: '' }],
    })
  }

  const handleRemoveAction = (condition: FormCondition, actionIndex: number) => {
    if (condition.actions.length <= 1) return
    updateCondition(condition.id, {
      actions: condition.actions.filter((_, i) => i !== actionIndex),
    })
  }

  const handleToggleLogic = (condition: FormCondition) => {
    updateCondition(condition.id, {
      logic: condition.logic === 'AND' ? 'OR' : 'AND',
    })
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b shrink-0">
        <h3 className="text-sm font-semibold">
          {filterFieldId ? 'Field Conditions' : 'Conditional Logic'}
        </h3>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleAddCondition}>
            <Plus className="h-3 w-3 mr-1" />
            Add Condition
          </Button>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <ScrollArea className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-4">
          {conditions.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">
              No conditions yet. Add one to create conditional logic for your form fields.
            </p>
          )}

          {conditions.map((condition) => (
            <ConditionCard
              key={condition.id}
              condition={condition}
              fieldEntries={fieldEntries}
              pages={pages}
              onToggleLogic={() => handleToggleLogic(condition)}
              onUpdateRule={(idx, updates) => handleUpdateRule(condition, idx, updates)}
              onAddRule={() => handleAddRule(condition)}
              onRemoveRule={(idx) => handleRemoveRule(condition, idx)}
              onUpdateAction={(idx, updates) => handleUpdateAction(condition, idx, updates)}
              onAddAction={() => handleAddAction(condition)}
              onRemoveAction={(idx) => handleRemoveAction(condition, idx)}
              onDelete={() => removeCondition(condition.id)}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}

function ConditionCard({
  condition,
  fieldEntries,
  pages,
  onToggleLogic,
  onUpdateRule,
  onAddRule,
  onRemoveRule,
  onUpdateAction,
  onAddAction,
  onRemoveAction,
  onDelete,
}: {
  condition: FormCondition
  fieldEntries: [string, { label: string; type: string }][]
  pages: { id: string; title: string }[]
  onToggleLogic: () => void
  onUpdateRule: (index: number, updates: Partial<FormConditionRule>) => void
  onAddRule: () => void
  onRemoveRule: (index: number) => void
  onUpdateAction: (index: number, updates: Partial<FormConditionAction>) => void
  onAddAction: () => void
  onRemoveAction: (index: number) => void
  onDelete: () => void
}) {
  return (
    <div className="border rounded-lg bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/30 rounded-t-lg">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">Logic:</span>
          <button
            type="button"
            onClick={onToggleLogic}
            className="text-xs font-semibold px-2 py-0.5 rounded border bg-background hover:bg-muted transition-colors"
          >
            {condition.logic}
          </button>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onDelete}
          className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="p-3 space-y-3">
        {/* Rules (IF) */}
        <div>
          <Label className="text-xs font-semibold uppercase text-muted-foreground">
            If
          </Label>
          <div className="mt-1.5 space-y-2">
            {condition.rules.map((rule, idx) => (
              <div key={idx} className="flex items-start gap-1.5">
                <div className="flex-1 space-y-1.5">
                  {/* Field selector */}
                  <select
                    value={rule.fieldId}
                    onChange={(e) => onUpdateRule(idx, { fieldId: e.target.value })}
                    className="w-full h-8 text-xs rounded-md border border-input bg-background px-2 focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">Select field...</option>
                    {fieldEntries.map(([id, field]) => (
                      <option key={id} value={id}>
                        {field.label} ({field.type})
                      </option>
                    ))}
                  </select>

                  {/* Operator */}
                  <select
                    value={rule.operator}
                    onChange={(e) =>
                      onUpdateRule(idx, {
                        operator: e.target.value as FormConditionRule['operator'],
                      })
                    }
                    className="w-full h-8 text-xs rounded-md border border-input bg-background px-2 focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    {OPERATORS.map((op) => (
                      <option key={op.value} value={op.value}>
                        {op.label}
                      </option>
                    ))}
                  </select>

                  {/* Value (hidden for isEmpty/isNotEmpty) */}
                  {!VALUE_HIDDEN_OPERATORS.includes(rule.operator) && (
                    <Input
                      value={rule.value}
                      onChange={(e) => onUpdateRule(idx, { value: e.target.value })}
                      placeholder="Value"
                      className="h-8 text-xs"
                    />
                  )}
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemoveRule(idx)}
                  disabled={condition.rules.length <= 1}
                  className="h-7 w-7 p-0 mt-0.5 text-muted-foreground hover:text-destructive shrink-0"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onAddRule}
            className="mt-1.5 h-7 text-xs text-muted-foreground"
          >
            <Plus className="h-3 w-3 mr-1" />
            Add Rule
          </Button>
        </div>

        <Separator />

        {/* Actions (THEN) */}
        <div>
          <Label className="text-xs font-semibold uppercase text-muted-foreground">
            Then
          </Label>
          <div className="mt-1.5 space-y-2">
            {condition.actions.map((action, idx) => (
              <div key={idx} className="flex items-start gap-1.5">
                <div className="flex-1 space-y-1.5">
                  {/* Action type */}
                  <select
                    value={action.type}
                    onChange={(e) => {
                      const type = e.target.value as FormConditionAction['type']
                      const updates: Partial<FormConditionAction> = { type }
                      if (type === 'skipToPage') {
                        updates.targetFieldId = undefined
                        updates.targetPageId = updates.targetPageId || ''
                      } else {
                        updates.targetPageId = undefined
                        updates.targetFieldId = updates.targetFieldId || ''
                      }
                      onUpdateAction(idx, updates)
                    }}
                    className="w-full h-8 text-xs rounded-md border border-input bg-background px-2 focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    {ACTION_TYPES.map((at) => (
                      <option key={at.value} value={at.value}>
                        {at.label}
                      </option>
                    ))}
                  </select>

                  {/* Target field (for show/hide/setValue) */}
                  {action.type !== 'skipToPage' && (
                    <select
                      value={action.targetFieldId || ''}
                      onChange={(e) =>
                        onUpdateAction(idx, { targetFieldId: e.target.value })
                      }
                      className="w-full h-8 text-xs rounded-md border border-input bg-background px-2 focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="">Select target field...</option>
                      {fieldEntries.map(([id, field]) => (
                        <option key={id} value={id}>
                          {field.label} ({field.type})
                        </option>
                      ))}
                    </select>
                  )}

                  {/* Target page (for skipToPage) */}
                  {action.type === 'skipToPage' && (
                    <select
                      value={action.targetPageId || ''}
                      onChange={(e) =>
                        onUpdateAction(idx, { targetPageId: e.target.value })
                      }
                      className="w-full h-8 text-xs rounded-md border border-input bg-background px-2 focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="">Select target page...</option>
                      {pages.map((page) => (
                        <option key={page.id} value={page.id}>
                          {page.title}
                        </option>
                      ))}
                    </select>
                  )}

                  {/* Value input (for setValue) */}
                  {action.type === 'setValue' && (
                    <Input
                      value={action.value || ''}
                      onChange={(e) =>
                        onUpdateAction(idx, { value: e.target.value })
                      }
                      placeholder="Set value to..."
                      className="h-8 text-xs"
                    />
                  )}
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemoveAction(idx)}
                  disabled={condition.actions.length <= 1}
                  className="h-7 w-7 p-0 mt-0.5 text-muted-foreground hover:text-destructive shrink-0"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onAddAction}
            className="mt-1.5 h-7 text-xs text-muted-foreground"
          >
            <Plus className="h-3 w-3 mr-1" />
            Add Action
          </Button>
        </div>
      </div>
    </div>
  )
}

/**
 * Compact inline version for the field settings panel.
 * Shows only conditions that target or reference the given field.
 */
export function FieldConditionsSummary({ fieldId }: { fieldId: string }) {
  const { definition, addCondition } = useBuilder()

  const relatedConditions = definition.conditions.filter(
    (c) =>
      c.actions.some((a) => a.targetFieldId === fieldId) ||
      c.rules.some((r) => r.fieldId === fieldId)
  )

  return (
    <div className="space-y-2">
      {relatedConditions.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          No conditions target this field.
        </p>
      ) : (
        <div className="space-y-1.5">
          {relatedConditions.map((c) => (
            <div
              key={c.id}
              className="text-xs border rounded px-2 py-1.5 bg-muted/30"
            >
              <span className="font-medium">{c.logic}</span>
              {' : '}
              {c.rules.length} rule{c.rules.length !== 1 ? 's' : ''}
              {' -> '}
              {c.actions.length} action{c.actions.length !== 1 ? 's' : ''}
            </div>
          ))}
        </div>
      )}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => addCondition()}
        className="w-full h-7 text-xs text-muted-foreground"
      >
        <Plus className="h-3 w-3 mr-1" />
        Add Condition
      </Button>
    </div>
  )
}
