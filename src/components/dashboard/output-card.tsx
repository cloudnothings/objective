"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, Copy, DollarSign, GitBranch, ChevronDown, Plus, Clock } from "lucide-react"
import { formatCost } from "@/lib/cost-utils"
import type { OutputCardType } from "@/types/dashboard"

interface OutputCardProps {
  card: OutputCardType
  generatorLabel: string
  onCopy: (outputId: string, data: object) => Promise<void>
  onCreateInputCard: (data: string) => Promise<void>
  copiedId: string | null
}

// Helper function to format generation time
const formatGenerationTime = (timeMs: number): string => {
  if (timeMs < 1000) {
    return `${timeMs}ms`
  }
  return `${(timeMs / 1000).toFixed(1)}s`
}

export function OutputCard({ card, generatorLabel, onCopy, onCreateInputCard, copiedId }: OutputCardProps) {
  return (
    <Card key={card.id} className="w-full max-w-full min-w-0">
      <CardHeader className="p-1.5 pb-0.5">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm font-mono">
              output
              {card.generationReference?.generatorConfig.model && (
                <span className="text-gray-500 font-mono text-xs ml-2">
                  {card.generationReference.generatorConfig.model}
                </span>
              )}
            </CardTitle>
            <CardDescription className="text-xs font-mono">
              from {generatorLabel}
            </CardDescription>
          </div>
          {/* Cost and timing info - always visible */}
          {(card.costInfo != null || card.generationTime != null) && (
            <div className="text-xs text-gray-500 font-mono text-right">
              <div className="flex items-center gap-3">
                {card.costInfo && (
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />
                    <span>{formatCost(card.costInfo.actualCost ?? card.costInfo.estimatedCost)}</span>
                  </div>
                )}
                {card.generationTime && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{formatGenerationTime(card.generationTime)}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-1.5 pt-0 w-full max-w-full min-w-0 overflow-hidden">
        {card.isLoading && (
          <div className="flex items-center justify-center h-24">
            <Loader2 className="h-5 w-5 animate-spin text-gray-500" />
          </div>
        )}
        {card.error && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 p-1.5 rounded text-xs font-mono space-y-1.5">
            <p className="font-semibold">error</p>
            {card.error.includes("Schema validation failed") ? (
              <div className="space-y-1">
                {card.error.split("Generated value:").map((part, index) => (
                  <div key={index}>
                    {index === 0 ? (
                      <p className="text-red-800 dark:text-red-200">{part.replace("Schema validation failed:", "").trim()}</p>
                    ) : (
                      <details className="mt-1.5">
                        <summary className="cursor-pointer font-semibold text-red-800 dark:text-red-200 hover:text-red-900 dark:hover:text-red-100">
                          View Generated Value
                        </summary>
                        <pre className="mt-1 p-1.5 bg-red-100 dark:bg-red-800/30 rounded text-xs overflow-x-auto whitespace-pre-wrap">
                          {part.trim()}
                        </pre>
                      </details>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="whitespace-pre-wrap">{card.error}</p>
            )}
          </div>
        )}
        {card.data && (
          <pre className="bg-gray-100 dark:bg-gray-800 p-1.5 rounded overflow-x-auto text-xs break-all custom-scrollbar font-mono w-full max-w-full whitespace-pre-wrap">
            {JSON.stringify(card.data, null, 2)}
          </pre>
        )}

        {/* Detailed Information - Collapsible */}
        {(card.generationReference ?? card.tokenBreakdown ?? card.costInfo) && (
          <details className="mt-1.5 cursor-pointer">
            <summary className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 font-mono flex items-center gap-1">
              <ChevronDown className="h-3 w-3" />
              <span>Details</span>
            </summary>
            <div className="mt-1.5 space-y-2 text-xs text-gray-500 font-mono">

              {/* Version Reference Information */}
              {card.generationReference && (
                <div className="space-y-1">
                  <div className="flex items-center gap-1 mb-1">
                    <GitBranch className="h-3 w-3" />
                    <span className="font-medium">Generation Reference</span>
                  </div>
                  <div className="space-y-1 ml-4">
                    <div className="flex justify-between">
                      <span>Input v{card.generationReference.inputCardVersion}:</span>
                      <span className="text-gray-400 max-w-[120px] truncate">
                        {card.generationReference.inputData.length > 20
                          ? `${card.generationReference.inputData.substring(0, 20)}...`
                          : card.generationReference.inputData
                        }
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Generator v{card.generationReference.generatorCardVersion}:</span>
                      <span className="text-gray-400 max-w-[120px] truncate">
                        {card.generationReference.generatorConfig.label}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Model:</span>
                      <span className="text-gray-400">
                        {card.generationReference.generatorConfig.model}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Detailed Cost Information */}
              {card.costInfo && (
                <div>
                  <div className="flex items-center gap-1 mb-1">
                    <DollarSign className="h-3 w-3" />
                    <span className="font-medium">Cost Breakdown</span>
                  </div>
                  <div className="space-y-1 ml-4">
                    <div className="flex justify-between">
                      <span>Estimated:</span>
                      <span>{formatCost(card.costInfo.estimatedCost)}</span>
                    </div>
                    {card.costInfo.actualCost && (
                      <div className="flex justify-between">
                        <span>Actual:</span>
                        <span className="font-medium">{formatCost(card.costInfo.actualCost)}</span>
                      </div>
                    )}
                    {card.costInfo.inputCost && (
                      <div className="flex justify-between text-gray-400">
                        <span>Input cost:</span>
                        <span>{formatCost(card.costInfo.inputCost)}</span>
                      </div>
                    )}
                    {card.costInfo.outputCost && (
                      <div className="flex justify-between text-gray-400">
                        <span>Output cost:</span>
                        <span>{formatCost(card.costInfo.outputCost)}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Token breakdown */}
              {card.tokenBreakdown && (
                <div>
                  <div className="font-medium mb-1">Token Details</div>
                  <div className="space-y-1 ml-4">
                    <div className="flex justify-between">
                      <span>Input text:</span>
                      <span>{card.tokenBreakdown.input} tokens</span>
                    </div>
                    <div className="flex justify-between">
                      <span>System message:</span>
                      <span>{card.tokenBreakdown.systemMessage} tokens</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Schema:</span>
                      <span>{card.tokenBreakdown.schema} tokens</span>
                    </div>
                    <div className="flex justify-between font-medium pt-1 border-t border-gray-200 dark:border-gray-600">
                      <span>Total input:</span>
                      <span>{card.tokenBreakdown.total} tokens</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Generation Config */}
              {card.generationReference && (
                <div>
                  <div className="font-medium mb-1">Generation Config</div>
                  <div className="space-y-1.5 ml-4">
                    <div>
                      <div className="font-medium text-gray-600 dark:text-gray-400">System Message:</div>
                      <div className="text-xs bg-gray-50 dark:bg-gray-800 p-1 rounded mt-1 max-h-16 overflow-y-auto">
                        {card.generationReference.generatorConfig.systemMessage}
                      </div>
                    </div>
                    {(card.generationReference.generatorConfig.schemaFields.length > 0 ||
                      card.generationReference.generatorConfig.rawSchema) && (
                        <div>
                          <div className="font-medium text-gray-600 dark:text-gray-400">Schema:</div>
                          <div className="text-xs bg-gray-50 dark:bg-gray-800 p-1 rounded mt-1 max-h-16 overflow-y-auto">
                            {card.generationReference.generatorConfig.rawSchema ??
                              `${card.generationReference.generatorConfig.schemaFields.length} fields`}
                          </div>
                        </div>
                      )}
                    <div>
                      <div className="font-medium text-gray-600 dark:text-gray-400">Input Data:</div>
                      <div className="text-xs bg-gray-50 dark:bg-gray-800 p-1 rounded mt-1 max-h-16 overflow-y-auto">
                        {card.generationReference.inputData}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </details>
        )}
      </CardContent>

      {card.data && (
        <CardFooter className="p-1.5 pt-0.5 flex gap-1.5">
          <Button
            variant="secondary"
            className="flex-1 h-6 text-xs font-mono"
            onClick={() => onCopy(card.id, card.data!)}
            disabled={copiedId === card.id}
          >
            {copiedId === card.id ? (
              "copied!"
            ) : (
              <>
                <Copy className="mr-1.5 h-3 w-3" />
                copy
              </>
            )}
          </Button>
          <Button
            variant="outline"
            className="flex-1 h-6 text-xs font-mono"
            onClick={() => onCreateInputCard(JSON.stringify(card.data, null, 2))}
          >
            <Plus className="mr-1.5 h-3 w-3" />
            to input
          </Button>
        </CardFooter>
      )}
    </Card>
  )
} 