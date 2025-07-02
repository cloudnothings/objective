"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ChevronsRight, X, ChevronDown, ChevronRight } from "lucide-react"
import { TokenVisualizer, tokenizeText } from "@/components/ui/token-visualizer"
import { VersionSelector } from "@/components/ui/version-selector"
import type { StringInputCardType } from "@/types/dashboard"

interface StringInputCardProps {
  card: StringInputCardType
  isActive: boolean
  tokenVisualizationEnabled: boolean
  showDeleteButton: boolean
  onInputChange: (id: string, data: string) => void
  onLabelChange: (id: string, label: string) => void
  onSelectInput: (id: string) => void
  onDeleteInput: (id: string) => void
  onVersionSelect: (id: string, version: number | null) => void
  onRevertToLatest: (id: string) => void
  onToggleTokenVisualization: (cardId: string) => void
}

export function StringInputCard({
  card,
  isActive,
  tokenVisualizationEnabled,
  showDeleteButton,
  onInputChange,
  onLabelChange,
  onSelectInput,
  onDeleteInput,
  onVersionSelect,
  onRevertToLatest,
  onToggleTokenVisualization,
}: StringInputCardProps) {
  return (
    <Card
      className={`transition-all duration-200 max-w-full overflow-hidden max-h-80 ${isActive
        ? "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 shadow-sm"
        : "hover:bg-gray-50 dark:hover:bg-gray-900/50 hover:shadow-sm"
        }`}
      onClick={() => onSelectInput(card.id)}
    >
      <CardHeader className="p-1.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <ChevronsRight className="h-3.5 w-3.5 flex-shrink-0 text-gray-400" />

            <input
              type="text"
              value={card.label}
              onChange={(e) => {
                e.stopPropagation()
                onLabelChange(card.id, e.target.value)
              }}
              onClick={(e) => e.stopPropagation()}
              className="text-xs font-mono bg-transparent border-none outline-none flex-1 min-w-0 w-0 placeholder-gray-400 focus:placeholder-gray-300 transition-colors"
              placeholder="input label..."
            />

            <span className="text-xs text-blue-500 bg-blue-50 dark:bg-blue-950/30 px-1.5 py-0.5 rounded-sm font-mono">
              STRING
            </span>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            {/* Version Selector */}
            <div onClick={(e) => e.stopPropagation()}>
              <VersionSelector
                versions={card.versions}
                currentVersion={card.currentVersion}
                hasUnsavedChanges={card.hasUnsavedChanges}
                onVersionSelect={(version) => onVersionSelect(card.id, version)}
                onRevertToLatest={() => onRevertToLatest(card.id)}
              />
            </div>

            {showDeleteButton && (
              <Button
                variant="ghost"
                size="sm"
                className="h-5 w-5 p-0 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all duration-200 flex-shrink-0"
                onClick={(e) => {
                  e.stopPropagation()
                  onDeleteInput(card.id)
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-1.5 pt-0 space-y-1.5 flex-1 overflow-hidden">
        <Textarea
          placeholder="paste text here..."
          className="w-full max-w-full text-xs bg-white dark:bg-gray-900 font-mono min-h-[60px] max-h-40 placeholder-gray-400 focus:placeholder-gray-300 border-gray-200 dark:border-gray-700 focus:border-blue-300 dark:focus:border-blue-600 transition-all duration-200 resize-none overflow-y-auto break-all"
          value={card.data}
          onChange={(e) => {
            onInputChange(card.id, e.target.value)
          }}
        />

        {card.data.trim() && (
          <div className="flex items-center justify-between pt-1 border-t border-gray-100 dark:border-gray-800">
            <div className="text-xs text-gray-500 font-mono">
              {tokenizeText(card.data).length} tokens
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-5 w-5 p-0 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-all duration-200"
              onClick={(e) => {
                e.stopPropagation()
                onToggleTokenVisualization(card.id)
              }}
              title={tokenVisualizationEnabled ? "Hide token view" : "Show token view"}
            >
              {tokenVisualizationEnabled ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
            </Button>
          </div>
        )}

        {tokenVisualizationEnabled && card.data.trim() && (
          <div className="border rounded-lg bg-gray-50 dark:bg-gray-900/50 p-1.5 border-gray-200 dark:border-gray-700 max-h-32 overflow-y-auto">
            <TokenVisualizer
              text={card.data}
              className="w-full"
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
} 