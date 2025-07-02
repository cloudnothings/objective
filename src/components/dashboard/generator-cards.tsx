"use client"

import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { ScrollArea } from "../ui/scroll-area"
import type { GeneratorCardType } from "@/types/dashboard"
import { GeneratorCard } from "./generator-card"

type GeneratorCardsProps = {
  generatorCards: GeneratorCardType[]
  onGeneratorChange: (id: string, field: keyof Omit<GeneratorCardType, "id" | "schemaFields" | "rawSchema" | "versions" | "currentVersion" | "hasUnsavedChanges">, value: string) => void
  onDeleteGeneratorCard: (id: string) => void
  onAddGeneratorCard: () => void
  onGenerate: (card: GeneratorCardType) => void
  onImportSchema: (id: string) => void
  onClearSchema: (id: string) => void
  onEditSchema: (id: string) => void
  onEditRawSchema: (id: string) => void
  onOpenSystemMessageDialog: (cardId: string) => void
  onOpenSchemaDialog: (cardId: string) => void
  onOpenFullConfigDialog: (cardId: string) => void
  generateSchemaString: (card: GeneratorCardType) => string
  canParseSchema: (rawSchema: string) => boolean
  importError: string | null
  onVersionSelect: (id: string, version: number | null) => void
  onRevertToLatest: (id: string) => void
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
  onVersionSelect,
  onRevertToLatest,
}: GeneratorCardsProps) {
  return (
    <div className="flex flex-col h-full space-y-1 overflow-hidden">
      <Button
        variant="outline"
        onClick={onAddGeneratorCard}
        className="w-full h-8 border-dashed border-2 text-xs font-mono text-gray-500 hover:text-gray-700 hover:border-gray-400 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:border-gray-500 flex-shrink-0 transition-all duration-200"
      >
        <Plus className="h-3.5 w-3.5 mr-1.5" />
        add generator
      </Button>
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="space-y-1">
            {generatorCards.map((card) => (
              <GeneratorCard
                key={card.id}
                card={card}
                onGeneratorChange={onGeneratorChange}
                onDeleteGeneratorCard={onDeleteGeneratorCard}
                onGenerate={onGenerate}
                onImportSchema={onImportSchema}
                onClearSchema={onClearSchema}
                onEditSchema={onEditSchema}
                onEditRawSchema={onEditRawSchema}
                onOpenSystemMessageDialog={onOpenSystemMessageDialog}
                onOpenSchemaDialog={onOpenSchemaDialog}
                onOpenFullConfigDialog={onOpenFullConfigDialog}
                generateSchemaString={generateSchemaString}
                canParseSchema={canParseSchema}
                onVersionSelect={onVersionSelect}
                onRevertToLatest={onRevertToLatest}
              />
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  )
} 