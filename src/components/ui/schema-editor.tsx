"use client"

import { useState } from "react"
import { Textarea } from "@/components/ui/textarea"

interface SchemaEditorProps {
  value: string
  onChange: (newValue: string) => void
}

export function SchemaEditor({ value, onChange }: SchemaEditorProps) {
  const [localValue, setLocalValue] = useState(value)

  const handleChange = (newValue: string) => {
    setLocalValue(newValue)
    onChange(newValue)
  }

  return (
    <Textarea
      value={localValue}
      onChange={(e) => handleChange(e.target.value)}
      placeholder="z.object({
  name: z.string().describe('Name'),
  age: z.number().describe('Age')
})"
      className="h-40 w-full resize-none text-xs font-mono"
    />
  )
}
