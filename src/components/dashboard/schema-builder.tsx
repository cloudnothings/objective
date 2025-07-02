"use client"

import type { SchemaField } from "@/types/dashboard"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { generateId } from "ai"
import { Trash2, Plus } from "lucide-react"

interface SchemaBuilderProps {
  value: SchemaField[]
  onChange: (value: SchemaField[]) => void
}

const ZOD_TYPES = ["string", "number", "boolean", "array", "enum", "object"] as const
const ZOD_ARRAY_TYPES = ["string", "number", "boolean", "object"] as const

export function SchemaBuilder({ value: fields, onChange }: SchemaBuilderProps) {
  const addField = () => {
    onChange([...fields, { id: generateId(), name: "", type: "string", description: "" }])
  }

  const removeField = (id: string) => {
    onChange(fields.filter((field) => field.id !== id))
  }

  const updateField = (id: string, newFieldData: Partial<SchemaField>) => {
    onChange(
      fields.map((field) => {
        if (field.id === id) {
          const updatedField = { ...field, ...newFieldData }
          // Reset conditional fields when type changes
          if (newFieldData.type) {
            if (newFieldData.type !== "enum") delete updatedField.enumValues
            if (newFieldData.type !== "array") {
              delete updatedField.arrayType
              delete updatedField.arrayObjectFields
            }
            if (newFieldData.type === "object" && !updatedField.objectFields) {
              updatedField.objectFields = []
            } else if (newFieldData.type !== "object") {
              delete updatedField.objectFields
            }
          }
          if (newFieldData.arrayType) {
            if (newFieldData.arrayType === "object" && !updatedField.arrayObjectFields) {
              updatedField.arrayObjectFields = []
            } else if (newFieldData.arrayType !== "object") {
              delete updatedField.arrayObjectFields
            }
          }
          return updatedField
        }
        return field
      }),
    )
  }

  return (
    <div className="space-y-1.5">
      <div className="space-y-1.5 rounded border p-2">
        {fields.map((field) => (
          <div key={field.id} className="space-y-1.5 rounded bg-gray-50 dark:bg-gray-800/50 p-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              <div>
                <Label htmlFor={`name-${field.id}`} className="text-xs font-mono">
                  name
                </Label>
                <Input
                  id={`name-${field.id}`}
                  placeholder="summary"
                  value={field.name}
                  onChange={(e) => updateField(field.id, { name: e.target.value })}
                  className="h-7 text-xs font-mono"
                />
              </div>
              <div>
                <Label htmlFor={`type-${field.id}`} className="text-xs font-mono">
                  type
                </Label>
                <Select
                  value={field.type}
                  onValueChange={(type) => updateField(field.id, { type: type as SchemaField["type"] })}
                >
                  <SelectTrigger id={`type-${field.id}`} className="h-7 text-xs font-mono">
                    <SelectValue placeholder="type" />
                  </SelectTrigger>
                  <SelectContent>
                    {ZOD_TYPES.map((type) => (
                      <SelectItem key={type} value={type} className="text-xs font-mono">
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor={`description-${field.id}`} className="text-xs font-mono">
                description
              </Label>
              <Input
                id={`description-${field.id}`}
                placeholder="Brief summary"
                value={field.description}
                onChange={(e) => updateField(field.id, { description: e.target.value })}
                className="h-7 text-xs font-mono"
              />
            </div>
            {field.type === "enum" && (
              <div>
                <Label htmlFor={`enum-${field.id}`} className="text-xs font-mono">
                  enum values
                </Label>
                <Input
                  id={`enum-${field.id}`}
                  placeholder="positive,neutral,negative"
                  value={field.enumValues?.join(",") ?? ""}
                  onChange={(e) =>
                    updateField(field.id, { enumValues: e.target.value.split(",").map((v) => v.trim()) })
                  }
                  className="h-7 text-xs font-mono"
                />
              </div>
            )}
            {field.type === "array" && (
              <>
                <div>
                  <Label htmlFor={`array-type-${field.id}`} className="text-xs font-mono">
                    array type
                  </Label>
                  <Select
                    value={field.arrayType ?? "string"}
                    onValueChange={(type) => updateField(field.id, { arrayType: type as SchemaField["arrayType"] })}
                  >
                    <SelectTrigger id={`array-type-${field.id}`} className="h-7 text-xs font-mono">
                      <SelectValue placeholder="type" />
                    </SelectTrigger>
                    <SelectContent>
                      {ZOD_ARRAY_TYPES.map((type) => (
                        <SelectItem key={type} value={type} className="text-xs font-mono">
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {field.arrayType === "object" && (
                  <div className="pl-3 border-l border-gray-300 dark:border-gray-600">
                    <Label className="text-xs font-mono text-muted-foreground">array object fields</Label>
                    <SchemaBuilder
                      value={field.arrayObjectFields ?? []}
                      onChange={(nestedFields) => updateField(field.id, { arrayObjectFields: nestedFields })}
                    />
                  </div>
                )}
              </>
            )}
            {field.type === "object" && (
              <div className="pl-3 border-l border-gray-300 dark:border-gray-600">
                <Label className="text-xs font-mono text-muted-foreground">object fields</Label>
                <SchemaBuilder
                  value={field.objectFields ?? []}
                  onChange={(nestedFields) => updateField(field.id, { objectFields: nestedFields })}
                />
              </div>
            )}
            <div className="flex justify-end -mb-1 -mr-1">
              <Button variant="ghost" size="icon" onClick={() => removeField(field.id)} className="h-6 w-6">
                <Trash2 className="h-3 w-3 text-red-500" />
                <span className="sr-only">Remove field</span>
              </Button>
            </div>
          </div>
        ))}
        <Button variant="outline" onClick={addField} className="w-full bg-transparent h-7 text-xs font-mono">
          <Plus className="mr-1.5 h-3 w-3" />
          add field
        </Button>
      </div>
    </div>
  )
}
