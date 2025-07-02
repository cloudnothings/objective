"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Plus, Code, Globe } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { InputCard } from "./input-card"
import type { InputCardType, FetchRequestConfig } from "@/types/dashboard"

interface InputCardsProps {
  inputCards: InputCardType[]
  activeInputId: string | null
  onInputChange: (id: string, data: string) => void
  onFetchConfigChange: (id: string, config: FetchRequestConfig) => void
  onLabelChange: (id: string, label: string) => void
  onSelectInput: (id: string) => void
  onAddStringInput: () => void
  onAddFetchInput: () => void
  onDeleteInput: (id: string) => void
  onVersionSelect: (id: string, version: number | null) => void
  onRevertToLatest: (id: string) => void
  onExecuteFetch: (id: string) => void
}

export function InputCards({
  inputCards,
  activeInputId,
  onInputChange,
  onFetchConfigChange,
  onLabelChange,
  onSelectInput,
  onAddStringInput,
  onAddFetchInput,
  onDeleteInput,
  onVersionSelect,
  onRevertToLatest,
  onExecuteFetch,
}: InputCardsProps) {
  const [tokenVisualizationEnabled, setTokenVisualizationEnabled] = useState<Record<string, boolean>>({})

  const toggleTokenVisualization = (cardId: string) => {
    setTokenVisualizationEnabled(prev => ({
      ...prev,
      [cardId]: !prev[cardId]
    }))
  }

  return (
    <div className="flex flex-col h-full space-y-1 w-full">
      <div className="flex gap-1">
        <Button
          variant="outline"
          className="h-8 border-dashed border-2 text-xs font-mono text-gray-500 hover:text-gray-700 hover:border-gray-400 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:border-gray-500 flex-shrink-0 transition-all duration-200 flex-1"
          onClick={onAddStringInput}
        >
          <Code className="h-3.5 w-3.5 mr-1.5" />
          add string
        </Button>

        <Button
          variant="outline"
          className="h-8 border-dashed border-2 text-xs font-mono text-orange-500 hover:text-orange-700 hover:border-orange-400 dark:text-orange-400 dark:hover:text-orange-300 dark:hover:border-orange-500 flex-shrink-0 transition-all duration-200 flex-1"
          onClick={onAddFetchInput}
        >
          <Globe className="h-3.5 w-3.5 mr-1.5" />
          add fetch
        </Button>
      </div>

      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="space-y-1">
            {inputCards.map((card) => {
              const isActive = card.id === activeInputId
              return (
                <InputCard
                  key={card.id}
                  card={card}
                  isActive={isActive}
                  tokenVisualizationEnabled={tokenVisualizationEnabled[card.id] ?? false}
                  showDeleteButton={inputCards.length > 1}
                  onInputChange={onInputChange}
                  onFetchConfigChange={onFetchConfigChange}
                  onLabelChange={onLabelChange}
                  onSelectInput={onSelectInput}
                  onDeleteInput={onDeleteInput}
                  onVersionSelect={onVersionSelect}
                  onRevertToLatest={onRevertToLatest}
                  onToggleTokenVisualization={toggleTokenVisualization}
                  onExecuteFetch={onExecuteFetch}
                />
              )
            })}
          </div>
        </ScrollArea>
      </div>
    </div>
  )
} 