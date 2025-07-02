"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  PlusCircle,
  Bot,
  Trash2,
  RotateCcw,
  Download,
  Sparkles,
  Wand2,
  Code,
  Pencil,
  Copy,
  Check,
} from "lucide-react"
import { SchemaPreview } from "@/components/ui/schema-preview"
import type { SchemaField } from "@/app/page"

export type GeneratorCardType = {
  id: number
  label: string
  systemMessage: string
  schemaFields: SchemaField[]
  rawSchema: string | null
  model: string
}

type GeneratorCardsProps = {
  generatorCards: GeneratorCardType[]
  onGeneratorChange: (id: number, field: keyof Omit<GeneratorCardType, "id" | "schemaFields" | "rawSchema">, value: string) => void
  onDeleteGeneratorCard: (id: number) => void
  onAddGeneratorCard: () => void
  onGenerate: (card: GeneratorCardType) => void
  onImportSchema: (id: number) => void
  onClearSchema: (id: number) => void
  onEditSchema: (id: number) => void
  onEditRawSchema: (id: number) => void
  onOpenSystemMessageDialog: (cardId: number) => void
  onOpenSchemaDialog: (cardId: number) => void
  onOpenFullConfigDialog: (cardId: number) => void
  generateSchemaString: (card: GeneratorCardType) => string
  canParseSchema: (rawSchema: string) => boolean
  importError: string | null
  availableModels: string[]
}

export function GeneratorCards({
  generatorCards,
  onGeneratorChange,
  onDeleteGeneratorCard,
  onAddGeneratorCard,
  onGenerate,
  onImportSchema,
  onClearSchema,
  onEditSchema,
  onEditRawSchema,
  onOpenSystemMessageDialog,
  onOpenSchemaDialog,
  onOpenFullConfigDialog,
  generateSchemaString,
  canParseSchema,
  importError,
  availableModels,
}: GeneratorCardsProps) {
  const [copiedStates, setCopiedStates] = useState<Record<number, boolean>>({})

  const handleCopy = (cardId: number, schema: string) => {
    void navigator.clipboard.writeText(schema)
    setCopiedStates(prev => ({ ...prev, [cardId]: true }))
    setTimeout(() => {
      setCopiedStates(prev => ({ ...prev, [cardId]: false }))
    }, 2000)
  }

  return (
    <div className="lg:col-span-4 space-y-1 overflow-y-auto custom-scrollbar pb-1 pr-0.5">
      {generatorCards.map((card) => (
        <Card key={card.id}>
          <CardHeader className="p-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-1.5 flex-grow">
                <Bot className="h-3.5 w-3.5" />
                <Input
                  value={card.label}
                  onChange={(e) => onGeneratorChange(card.id, "label", e.target.value)}
                  className="h-6 text-xs font-mono bg-transparent border-none p-0 focus-visible:ring-0 flex-grow"
                  placeholder="label..."
                />
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onOpenFullConfigDialog(card.id)}
                  className="h-6 w-6 text-xs"
                  title="Generate complete config with AI"
                >
                  <Wand2 className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-destructive h-6 w-6"
                  onClick={() => onDeleteGeneratorCard(card.id)}
                >
                  <Trash2 className="h-3 w-3" />
                  <span className="sr-only">Delete Generator Card</span>
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 p-2 pt-0">
            <div>
              <Label htmlFor={`model-${card.id}`} className="text-xs font-mono">
                model
              </Label>
              <Select value={card.model} onValueChange={(value) => onGeneratorChange(card.id, "model", value)}>
                <SelectTrigger id={`model-${card.id}`} className="h-7 text-xs font-mono">
                  <SelectValue placeholder="model" />
                </SelectTrigger>
                <SelectContent>
                  {availableModels.map((m) => (
                    <SelectItem key={m} value={m} className="text-xs font-mono">
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <Label htmlFor={`system-message-${card.id}`} className="text-xs font-mono">
                  system
                </Label>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onOpenSystemMessageDialog(card.id)}
                  className="h-6 w-6 text-xs"
                  title="Generate with AI"
                >
                  <Sparkles className="h-3 w-3" />
                </Button>
              </div>
              <Textarea
                id={`system-message-${card.id}`}
                placeholder="system message..."
                value={card.systemMessage}
                onChange={(e) => onGeneratorChange(card.id, "systemMessage", e.target.value)}
                className="h-16 text-xs font-mono"
              />
            </div>
            <div>
              <div className="flex items-center justify-end mb-1">
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onOpenSchemaDialog(card.id)}
                    className="h-6 w-6 text-xs"
                    title="Generate with AI"
                  >
                    <Sparkles className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onImportSchema(card.id)}
                    className="h-6 w-6 text-xs"
                    title="Import from clipboard"
                  >
                    <Download className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onClearSchema(card.id)}
                    className="h-6 w-6 text-xs"
                    title="Clear schema"
                  >
                    <RotateCcw className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleCopy(card.id, generateSchemaString(card))}
                    className="h-6 w-6 text-xs"
                    disabled={copiedStates[card.id]}
                    title="Copy schema"
                  >
                    {copiedStates[card.id] ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEditRawSchema(card.id)}
                    className="h-6 w-6 text-xs"
                    title="Edit raw schema"
                  >
                    <Code className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      if (card.rawSchema && !canParseSchema(card.rawSchema)) {
                        if (
                          window.confirm(
                            "This schema is complex and may not display correctly in the visual builder. Continue anyway? (Use the code editor for full control)",
                          )
                        ) {
                          onEditSchema(card.id)
                        }
                      } else {
                        onEditSchema(card.id)
                      }
                    }}
                    className="h-6 w-6 text-xs"
                    title="Edit with builder"
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <SchemaPreview schema={generateSchemaString(card)} />
            </div>
          </CardContent>
          <CardFooter className="p-2">
            <Button onClick={() => onGenerate(card)} className="w-full h-7 text-xs font-mono">
              generate
            </Button>
          </CardFooter>
        </Card>
      ))}
      <Button
        variant="outline"
        onClick={onAddGeneratorCard}
        className="w-full bg-transparent h-7 text-xs font-mono"
      >
        <PlusCircle className="mr-1.5 h-3 w-3" />
        add generator
      </Button>
    </div>
  )
} 