export interface FieldTypeDefinition {
  type: string
  label: string
  icon: string // lucide icon name
  category: 'basic' | 'choice' | 'advanced' | 'layout'
  defaultConfig: {
    label: string
    placeholder?: string
    required?: boolean
    validation?: Record<string, unknown>
    options?: { label: string; value: string }[]
  }
}

export const FIELD_TYPES: FieldTypeDefinition[] = [
  // Basic
  {
    type: 'text',
    label: 'Text',
    icon: 'Type',
    category: 'basic',
    defaultConfig: { label: 'Text Field', placeholder: '', required: false },
  },
  {
    type: 'textarea',
    label: 'Textarea',
    icon: 'AlignLeft',
    category: 'basic',
    defaultConfig: { label: 'Textarea', placeholder: '', required: false },
  },
  {
    type: 'email',
    label: 'Email',
    icon: 'Mail',
    category: 'basic',
    defaultConfig: { label: 'Email', placeholder: 'you@example.com', required: false },
  },
  {
    type: 'phone',
    label: 'Phone',
    icon: 'Phone',
    category: 'basic',
    defaultConfig: { label: 'Phone', placeholder: '(555) 123-4567', required: false },
  },
  {
    type: 'number',
    label: 'Number',
    icon: 'Hash',
    category: 'basic',
    defaultConfig: { label: 'Number', placeholder: '', required: false },
  },
  // Choice
  {
    type: 'select',
    label: 'Dropdown',
    icon: 'ChevronDown',
    category: 'choice',
    defaultConfig: {
      label: 'Dropdown',
      required: false,
      options: [
        { label: 'Option 1', value: 'option_1' },
        { label: 'Option 2', value: 'option_2' },
      ],
    },
  },
  {
    type: 'multi_select',
    label: 'Multi-Select',
    icon: 'ListChecks',
    category: 'choice',
    defaultConfig: {
      label: 'Multi-Select',
      required: false,
      options: [
        { label: 'Option 1', value: 'option_1' },
        { label: 'Option 2', value: 'option_2' },
      ],
    },
  },
  {
    type: 'radio',
    label: 'Radio Buttons',
    icon: 'CircleDot',
    category: 'choice',
    defaultConfig: {
      label: 'Radio Buttons',
      required: false,
      options: [
        { label: 'Option 1', value: 'option_1' },
        { label: 'Option 2', value: 'option_2' },
      ],
    },
  },
  {
    type: 'checkbox',
    label: 'Checkboxes',
    icon: 'CheckSquare',
    category: 'choice',
    defaultConfig: {
      label: 'Checkboxes',
      required: false,
      options: [
        { label: 'Option 1', value: 'option_1' },
        { label: 'Option 2', value: 'option_2' },
      ],
    },
  },
  // Advanced
  {
    type: 'file',
    label: 'File Upload',
    icon: 'Upload',
    category: 'advanced',
    defaultConfig: { label: 'File Upload', required: false },
  },
  {
    type: 'date',
    label: 'Date Picker',
    icon: 'Calendar',
    category: 'advanced',
    defaultConfig: { label: 'Date', required: false },
  },
  {
    type: 'hidden',
    label: 'Hidden Field',
    icon: 'EyeOff',
    category: 'advanced',
    defaultConfig: { label: 'Hidden Field', required: false },
  },
  // Layout
  {
    type: 'html',
    label: 'HTML Block',
    icon: 'Code',
    category: 'layout',
    defaultConfig: { label: 'HTML Block' },
  },
  {
    type: 'divider',
    label: 'Section Divider',
    icon: 'Minus',
    category: 'layout',
    defaultConfig: { label: 'Section Divider' },
  },
  {
    type: 'page_break',
    label: 'Page Break',
    icon: 'FileStack',
    category: 'layout',
    defaultConfig: { label: 'Page Break' },
  },
]

export function getFieldType(type: string): FieldTypeDefinition | undefined {
  return FIELD_TYPES.find(f => f.type === type)
}
