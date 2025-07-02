"use client"

import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { OutputCard } from "./output-card"
import type { GeneratorCardType, OutputCardType } from "@/types/dashboard"
import { ApiConfig } from "../ui/api-config"

interface OutputCardsProps {
  outputCards: OutputCardType[]
  generatorCards: GeneratorCardType[]
  onCopy: (outputId: string, data: object) => Promise<void>
  onCreateInputCard: (data: string) => Promise<void>
  copiedId: string | null
}

export function OutputCards({ outputCards, generatorCards, onCopy, onCreateInputCard, copiedId }: OutputCardsProps) {
  return (
    <div className="flex flex-col h-full space-y-1">
      <ApiConfig className="flex-shrink-0" />
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="space-y-1">
            {outputCards.length === 0 && (
              <Card className="flex items-center shadow-none justify-center h-8 border-dashed border-2 text-xs font-mono text-gray-500 hover:text-gray-700 hover:border-gray-400 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:border-gray-500 transition-all duration-200">
                <p>output appears here</p>
              </Card>
            )}
            {outputCards.map((card) => (
              <OutputCard
                key={card.id}
                card={card}
                generatorLabel={generatorCards.find((g) => g.id === card.generatorId)?.label ?? `gen#${card.generatorId}`}
                onCopy={onCopy}
                onCreateInputCard={onCreateInputCard}
                copiedId={copiedId}
              />
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  )
} 