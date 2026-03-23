'use client'

import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'

export interface StyleConfigValues {
  primaryColor: string
  backgroundColor: string
  textColor: string
  borderRadius: string
  fontFamily: string
}

export const DEFAULT_STYLE_CONFIG: StyleConfigValues = {
  primaryColor: '#3b82f6',
  backgroundColor: '#ffffff',
  textColor: '#1f2937',
  borderRadius: 'medium',
  fontFamily: 'default',
}

interface StyleConfigPanelProps {
  value: StyleConfigValues
  onChange: (value: StyleConfigValues) => void
}

export function StyleConfigPanel({ value, onChange }: StyleConfigPanelProps) {
  function update(key: keyof StyleConfigValues, val: string) {
    onChange({ ...value, [key]: val })
  }

  return (
    <div className="space-y-4">
      <h3 className="text-xs font-semibold uppercase text-muted-foreground">
        Form Styles
      </h3>

      {/* Colors */}
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="style-primary" className="text-xs">Primary Color</Label>
          <div className="flex items-center gap-2">
            <input
              id="style-primary"
              type="color"
              value={value.primaryColor}
              onChange={(e) => update('primaryColor', e.target.value)}
              className="h-8 w-8 rounded border cursor-pointer p-0"
            />
            <span className="text-xs text-muted-foreground font-mono">{value.primaryColor}</span>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="style-bg" className="text-xs">Background Color</Label>
          <div className="flex items-center gap-2">
            <input
              id="style-bg"
              type="color"
              value={value.backgroundColor}
              onChange={(e) => update('backgroundColor', e.target.value)}
              className="h-8 w-8 rounded border cursor-pointer p-0"
            />
            <span className="text-xs text-muted-foreground font-mono">{value.backgroundColor}</span>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="style-text" className="text-xs">Text Color</Label>
          <div className="flex items-center gap-2">
            <input
              id="style-text"
              type="color"
              value={value.textColor}
              onChange={(e) => update('textColor', e.target.value)}
              className="h-8 w-8 rounded border cursor-pointer p-0"
            />
            <span className="text-xs text-muted-foreground font-mono">{value.textColor}</span>
          </div>
        </div>
      </div>

      <Separator />

      {/* Border Radius */}
      <div className="space-y-1.5">
        <Label htmlFor="style-radius" className="text-xs">Border Radius</Label>
        <select
          id="style-radius"
          value={value.borderRadius}
          onChange={(e) => update('borderRadius', e.target.value)}
          className="w-full h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm"
        >
          <option value="none">None</option>
          <option value="small">Small</option>
          <option value="medium">Medium</option>
          <option value="large">Large</option>
        </select>
      </div>

      {/* Font Family */}
      <div className="space-y-1.5">
        <Label htmlFor="style-font" className="text-xs">Font Family</Label>
        <select
          id="style-font"
          value={value.fontFamily}
          onChange={(e) => update('fontFamily', e.target.value)}
          className="w-full h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm"
        >
          <option value="default">System Default</option>
          <option value="serif">Serif</option>
          <option value="monospace">Monospace</option>
        </select>
      </div>
    </div>
  )
}
