"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Bot,
  Trash2,
  RotateCcw,
  Download,
  Sparkles,
  Wand2,
  Code,
  Pencil,
  ChevronDown,
  ChevronRight,
} from "lucide-react"
import { SchemaPreview } from "@/components/dashboard/schema-preview"
import { countTokens, getTokenCounts } from "@/lib/token-utils"
import { useDashboardStore } from "@/store/dashboard-store"
import {
  getModelInfo,
  getAvailableModels,
  estimateCost,
  estimateOutputTokens,
  formatCost,
  shouldWarnAboutCost
} from "@/lib/cost-utils"
import { ModelInfoDisplay } from "@/components/ui/model-info"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle } from "lucide-react"
import { VersionSelector } from "@/components/ui/version-selector"
import type { GeneratorCardType } from "@/types/dashboard"
import { useState } from "react"

type GeneratorCardProps = {
  card: GeneratorCardType
  onGeneratorChange: (id: string, field: keyof Omit<GeneratorCardType, "id" | "schemaFields" | "rawSchema" | "versions" | "currentVersion" | "hasUnsavedChanges">, value: string) => void
  onDeleteGeneratorCard: (id: string) => void
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
  onVersionSelect: (id: string, version: number | null) => void
  onRevertToLatest: (id: string) => void
}

export function GeneratorCard({
  card,
  onGeneratorChange,
  onDeleteGeneratorCard,
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
}: GeneratorCardProps) {
  const { getActiveInputData } = useDashboardStore()
  const availableModelsList = getAvailableModels()
  const [expandedModelDetails, setExpandedModelDetails] = useState(false)

  const toggleModelDetails = () => {
    setExpandedModelDetails(prev => !prev)
  }

  return (
    <Card className="max-w-full overflow-hidden">
      <CardHeader className="p-1.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Input
              value={card.label}
              onChange={(e) => onGeneratorChange(card.id, "label", e.target.value)}
              className="h-5 text-xs font-mono bg-transparent border-none p-0 focus-visible:ring-0 flex-grow min-w-0 w-0"
              placeholder="generator label..."
            />
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            {/* Version Selector */}
            <div>
              <VersionSelector
                versions={card.versions}
                currentVersion={card.currentVersion}
                hasUnsavedChanges={card.hasUnsavedChanges}
                onVersionSelect={(version) => onVersionSelect(card.id, version)}
                onRevertToLatest={() => onRevertToLatest(card.id)}
              />
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenFullConfigDialog(card.id)}
              className="h-5 w-5 text-xs"
              title="Generate complete config with AI"
            >
              <Wand2 className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-destructive h-5 w-5"
              onClick={() => onDeleteGeneratorCard(card.id)}
            >
              <Trash2 className="h-3 w-3" />
              <span className="sr-only">Delete Generator Card</span>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-1.5 p-1.5 pt-0">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor={`model-${card.id}`} className="text-xs font-mono">
              model
            </Label>
            {getModelInfo(card.model) && (
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleModelDetails}
                className="h-4 w-4 text-xs"
                title="Toggle model details"
              >
                {expandedModelDetails ? (
                  <ChevronDown className="h-3 w-3" />
                ) : (
                  <ChevronRight className="h-3 w-3" />
                )}
              </Button>
            )}
          </div>
          <Select value={card.model} onValueChange={(value) => onGeneratorChange(card.id, "model", value)}>
            <SelectTrigger id={`model-${card.id}`} className="h-6 text-xs font-mono">
              <SelectValue placeholder="model" />
            </SelectTrigger>
            <SelectContent>
              {availableModelsList.map((model) => (
                <SelectItem key={model.id} value={model.id} className="text-xs font-mono">
                  <div className="flex items-center justify-between w-full">
                    <span>{model.id}</span>
                    <div className="ml-2 text-gray-500">
                      {formatCost(model.inputCost)}/{formatCost(model.outputCost)} per 1M
                      {model.supports?.reasoning && (
                        <Badge variant="secondary" className="ml-1 text-xs">R</Badge>
                      )}
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Collapsible model details */}
          {(() => {
            const selectedModel = getModelInfo(card.model)
            return selectedModel && expandedModelDetails ? (
              <div className="p-1.5 bg-gray-50 dark:bg-gray-900 rounded border">
                <ModelInfoDisplay model={selectedModel} />
              </div>
            ) : null
          })()}
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
              className="h-5 w-5 text-xs"
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
            className="h-14 text-xs font-mono w-full max-w-full resize-none overflow-hidden"
            style={{ wordBreak: 'break-all', overflowWrap: 'break-word' }}
          />
          {card.systemMessage.trim() && (
            <div className="text-xs text-gray-500 font-mono mt-1">
              {countTokens(card.systemMessage, card.model)} tokens
            </div>
          )}
        </div>
        <div>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5 flex-grow">
              <Label htmlFor={`schema-${card.id}`} className="text-xs font-mono">
                schema
              </Label>
            </div>
            <div className="flex gap-0.5">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onOpenSchemaDialog(card.id)}
                className="h-5 w-5 text-xs"
                title="Generate with AI"
              >
                <Sparkles className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onImportSchema(card.id)}
                className="h-5 w-5 text-xs"
                title="Import from clipboard"
              >
                <Download className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onClearSchema(card.id)}
                className="h-5 w-5 text-xs"
                title="Clear schema"
              >
                <RotateCcw className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onEditRawSchema(card.id)}
                className="h-5 w-5 text-xs"
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
                className="h-5 w-5 text-xs"
                title="Edit with builder"
              >
                <Pencil className="h-3 w-3" />
              </Button>
            </div>
          </div>
          <SchemaPreview schema={generateSchemaString(card)} />
          {(card.schemaFields.length > 0 || card.rawSchema) && (
            <div className="text-xs text-gray-500 font-mono mt-1">
              {countTokens(generateSchemaString(card), card.model)} schema tokens
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="p-1.5 pt-1.5 bg-gray-50/50 dark:bg-gray-900/50 border-t">
        <div className="w-full space-y-1.5">
          {(() => {
            const activeInputData = getActiveInputData()
            const schemaString = generateSchemaString(card)
            const tokenBreakdown = getTokenCounts(activeInputData, card, schemaString)
            const hasSchema = card.schemaFields.length > 0 || !!card.rawSchema
            const estimatedOutputTokens = estimateOutputTokens(tokenBreakdown.total, hasSchema)
            const costEstimate = estimateCost(tokenBreakdown.total, estimatedOutputTokens, card.model)
            const shouldWarn = shouldWarnAboutCost(costEstimate.totalEstimatedCost)

            return (
              <>
                {/* Clean horizontal layout */}
                <div className="flex items-center justify-between gap-3">
                  {/* Token and Cost Summary */}
                  <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <span className="font-mono font-medium">{tokenBreakdown.total}</span>
                      <span>tokens</span>
                    </div>
                    <div className="text-gray-500">•</div>
                    <div className="flex items-center gap-1">
                      <span className="font-mono font-medium">{formatCost(costEstimate.totalEstimatedCost)}</span>
                      <span>estimated</span>
                    </div>
                  </div>

                  {/* Generate Button */}
                  <Button
                    onClick={() => onGenerate(card)}
                    size="sm"
                    className={`h-7 px-3 text-xs font-medium ${costEstimate.exceedsMaxTokens
                      ? "bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800"
                      : shouldWarn
                        ? "bg-amber-600 hover:bg-amber-700 dark:bg-amber-700 dark:hover:bg-amber-800"
                        : ""
                      }`}
                    disabled={costEstimate.exceedsMaxTokens}
                  >
                    {costEstimate.exceedsMaxTokens ? "Context too large" : "Generate"}
                  </Button>
                </div>

                {/* Warnings - only show if present */}
                {(shouldWarn || costEstimate.exceedsMaxTokens) && (
                  <div className="space-y-1">
                    {shouldWarn && (
                      <div className="flex items-center gap-2 p-1 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded">
                        <AlertTriangle className="h-3 w-3 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                        <span className="text-xs text-amber-700 dark:text-amber-300">High cost warning: ≥$1.00</span>
                      </div>
                    )}
                    {costEstimate.exceedsMaxTokens && (
                      <div className="flex items-center gap-2 p-1 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
                        <AlertTriangle className="h-3 w-3 text-red-600 dark:text-red-400 flex-shrink-0" />
                        <div className="flex-1">
                          <div className="text-xs text-red-700 dark:text-red-300 font-medium">Context too large for this model</div>
                          {costEstimate.suggestedAlternatives && (
                            <div className="text-xs text-red-600 dark:text-red-400 mt-0.5">
                              Try: {costEstimate.suggestedAlternatives.slice(0, 2).map(alt => alt.id).join(", ")}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )
          })()}
        </div>
      </CardFooter>
    </Card>
  )
} 