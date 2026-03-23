export interface FieldOption {
  label: string
  value: string
}

export interface FieldValidation {
  minLength?: number
  maxLength?: number
  min?: number
  max?: number
  pattern?: string
  customMessage?: string
}

export interface FormField {
  type: string
  label: string
  placeholder?: string
  required?: boolean
  validation?: FieldValidation
  options?: FieldOption[]
  defaultValue?: string
  htmlContent?: string // for html block type
  cssClass?: string
}

export interface RowColumn {
  width: number // 1-12 grid
  fieldId: string
}

export interface FormRow {
  id: string
  columns: RowColumn[]
}

export interface FormPage {
  id: string
  title: string
  rows: FormRow[]
}

export interface FormConditionRule {
  fieldId: string
  operator:
    | 'equals'
    | 'notEquals'
    | 'contains'
    | 'notContains'
    | 'greaterThan'
    | 'lessThan'
    | 'isEmpty'
    | 'isNotEmpty'
  value: string
}

export interface FormConditionAction {
  type: 'show' | 'hide' | 'setValue' | 'skipToPage'
  targetFieldId?: string
  targetPageId?: string
  value?: string
}

export interface FormCondition {
  id: string
  logic: 'AND' | 'OR'
  rules: FormConditionRule[]
  actions: FormConditionAction[]
}

export interface FormDefinition {
  pages: FormPage[]
  fields: Record<string, FormField>
  conditions: FormCondition[]
}

export function createEmptyDefinition(): FormDefinition {
  return {
    pages: [{ id: 'page_1', title: 'Page 1', rows: [] }],
    fields: {},
    conditions: [],
  }
}
