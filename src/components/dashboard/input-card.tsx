"use client"

import { StringInputCard } from "./string-input-card"
import { FetchRequestCard } from "./fetch-request-card"
import type { InputCardType, FetchRequestConfig } from "@/types/dashboard"

interface InputCardProps {
  card: InputCardType
  isActive: boolean
  tokenVisualizationEnabled: boolean
  showDeleteButton: boolean
  onInputChange: (id: string, data: string) => void
  onFetchConfigChange: (id: string, config: FetchRequestConfig) => void
  onLabelChange: (id: string, label: string) => void
  onSelectInput: (id: string) => void
  onDeleteInput: (id: string) => void
  onVersionSelect: (id: string, version: number | null) => void
  onRevertToLatest: (id: string) => void
  onToggleTokenVisualization: (cardId: string) => void
  onExecuteFetch: (id: string) => void
}

export function InputCard({
  card,
  isActive,
  tokenVisualizationEnabled,
  showDeleteButton,
  onInputChange,
  onFetchConfigChange,
  onLabelChange,
  onSelectInput,
  onDeleteInput,
  onVersionSelect,
  onRevertToLatest,
  onToggleTokenVisualization,
  onExecuteFetch,
}: InputCardProps) {
  if (card.type === "string") {
    return (
      <StringInputCard
        card={card}
        isActive={isActive}
        tokenVisualizationEnabled={tokenVisualizationEnabled}
        showDeleteButton={showDeleteButton}
        onInputChange={onInputChange}
        onLabelChange={onLabelChange}
        onSelectInput={onSelectInput}
        onDeleteInput={onDeleteInput}
        onVersionSelect={onVersionSelect}
        onRevertToLatest={onRevertToLatest}
        onToggleTokenVisualization={onToggleTokenVisualization}
      />
    )
  }

  if (card.type === "fetch") {
    return (
      <FetchRequestCard
        card={card}
        isActive={isActive}
        showDeleteButton={showDeleteButton}
        onConfigChange={onFetchConfigChange}
        onLabelChange={onLabelChange}
        onSelectInput={onSelectInput}
        onDeleteInput={onDeleteInput}
        onVersionSelect={onVersionSelect}
        onRevertToLatest={onRevertToLatest}
        onExecuteFetch={onExecuteFetch}
      />
    )
  }

  // This should never happen but provides type safety
  return null
} 