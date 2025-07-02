"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronsRight, X, Play, Plus, Trash2 } from "lucide-react"
import { VersionSelector } from "@/components/ui/version-selector"
import type { FetchRequestInputCardType, FetchRequestConfig } from "@/types/dashboard"

interface FetchRequestCardProps {
  card: FetchRequestInputCardType
  isActive: boolean
  showDeleteButton: boolean
  onConfigChange: (id: string, config: FetchRequestConfig) => void
  onLabelChange: (id: string, label: string) => void
  onSelectInput: (id: string) => void
  onDeleteInput: (id: string) => void
  onVersionSelect: (id: string, version: number | null) => void
  onRevertToLatest: (id: string) => void
  onExecuteFetch: (id: string) => void
}

export function FetchRequestCard({
  card,
  isActive,
  showDeleteButton,
  onConfigChange,
  onLabelChange,
  onSelectInput,
  onDeleteInput,
  onVersionSelect,
  onRevertToLatest,
  onExecuteFetch,
}: FetchRequestCardProps) {
  const updateConfig = (updates: Partial<FetchRequestConfig>) => {
    onConfigChange(card.id, { ...card.fetchConfig, ...updates })
  }

  const addHeader = () => {
    const newHeaders = { ...card.fetchConfig.headers }
    // Find a unique key for the new header
    let newKey = "New-Header"
    let counter = 1
    while (newHeaders[newKey]) {
      newKey = `New-Header-${counter}`
      counter++
    }
    newHeaders[newKey] = ""
    updateConfig({ headers: newHeaders })
  }

  const updateHeaderKey = (oldKey: string, newKey: string) => {
    const newHeaders = { ...card.fetchConfig.headers }
    const value = newHeaders[oldKey] ?? ""
    delete newHeaders[oldKey]
    if (newKey.trim()) {
      newHeaders[newKey.trim()] = value
    }
    updateConfig({ headers: newHeaders })
  }

  const updateHeaderValue = (key: string, value: string) => {
    const newHeaders = { ...card.fetchConfig.headers }
    newHeaders[key] = value
    updateConfig({ headers: newHeaders })
  }

  const removeHeader = (key: string) => {
    const newHeaders = { ...card.fetchConfig.headers }
    delete newHeaders[key]
    updateConfig({ headers: newHeaders })
  }

  return (
    <Card
      className={`transition-all duration-200 max-w-full overflow-hidden ${isActive
        ? "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 shadow-sm"
        : "hover:bg-gray-50 dark:hover:bg-gray-900/50 hover:shadow-sm"
        }`}
      onClick={() => onSelectInput(card.id)}
    >
      <CardHeader className="p-1.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <ChevronsRight className="h-3.5 w-3.5 flex-shrink-0 text-orange-400" />

            <input
              type="text"
              value={card.label}
              onChange={(e) => {
                e.stopPropagation()
                onLabelChange(card.id, e.target.value)
              }}
              onClick={(e) => e.stopPropagation()}
              className="text-xs font-mono bg-transparent border-none outline-none flex-1 min-w-0 w-0 placeholder-gray-400 focus:placeholder-gray-300 transition-colors"
              placeholder="fetch request label..."
            />

            <span className="text-xs text-orange-500 bg-orange-50 dark:bg-orange-950/30 px-1.5 py-0.5 rounded-sm font-mono">
              FETCH
            </span>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            {/* Execute Fetch Button */}
            <Button
              variant="ghost"
              size="sm"
              className="h-5 w-5 p-0 text-orange-500 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/30 transition-all duration-200 flex-shrink-0"
              onClick={(e) => {
                e.stopPropagation()
                onExecuteFetch(card.id)
              }}
              title="Execute fetch request and create string input"
            >
              <Play className="h-3 w-3" />
            </Button>

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

      <CardContent className="p-1.5 pt-0 space-y-2">
        {/* Method and URL */}
        <div className="flex gap-2">
          <div onClick={(e) => e.stopPropagation()}>
            <Select
              value={card.fetchConfig.method}
              onValueChange={(method: FetchRequestConfig["method"]) => updateConfig({ method })}
            >
              <SelectTrigger className="w-20 h-6 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="GET">GET</SelectItem>
                <SelectItem value="POST">POST</SelectItem>
                <SelectItem value="PUT">PUT</SelectItem>
                <SelectItem value="PATCH">PATCH</SelectItem>
                <SelectItem value="DELETE">DELETE</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Input
            placeholder="https://pokeapi.co/api/v2/pokemon/ditto"
            className="text-xs h-6 flex-1"
            value={card.fetchConfig.url}
            onChange={(e) => {
              e.stopPropagation()
              updateConfig({ url: e.target.value })
            }}
            onClick={(e) => e.stopPropagation()}
          />
        </div>

        {/* Headers */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500 font-mono">Headers</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-5 w-5 p-0 text-gray-400 hover:text-blue-500"
              onClick={(e) => {
                e.stopPropagation()
                addHeader()
              }}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>

          {Object.entries(card.fetchConfig.headers).map(([key, value], index) => (
            <div key={`${key}-${index}`} className="flex gap-1">
              <Input
                placeholder="Header name"
                className="text-xs h-6 flex-1"
                value={key}
                onChange={(e) => {
                  e.stopPropagation()
                  updateHeaderKey(key, e.target.value)
                }}
                onClick={(e) => e.stopPropagation()}
              />
              <Input
                placeholder="Header value"
                className="text-xs h-6 flex-1"
                value={value}
                onChange={(e) => {
                  e.stopPropagation()
                  updateHeaderValue(key, e.target.value)
                }}
                onClick={(e) => e.stopPropagation()}
              />
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-gray-400 hover:text-red-500"
                onClick={(e) => {
                  e.stopPropagation()
                  removeHeader(key)
                }}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>

        {/* Request Body (for non-GET methods) */}
        {card.fetchConfig.method !== "GET" && (
          <div className="space-y-1">
            <span className="text-xs text-gray-500 font-mono">Request Body</span>
            <Textarea
              placeholder="Request body (JSON, form data, etc.)"
              className="w-full text-xs bg-white dark:bg-gray-900 font-mono min-h-[40px] placeholder-gray-400 focus:placeholder-gray-300 border-gray-200 dark:border-gray-700 focus:border-blue-300 dark:focus:border-blue-600 transition-all duration-200 resize-none"
              value={card.fetchConfig.body ?? ""}
              onChange={(e) => {
                e.stopPropagation()
                updateConfig({ body: e.target.value })
              }}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}

        {/* Timeout */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 font-mono">Timeout (ms):</span>
          <Input
            type="number"
            placeholder="5000"
            className="text-xs h-6 w-20"
            value={card.fetchConfig.timeout ?? ""}
            onChange={(e) => {
              e.stopPropagation()
              updateConfig({ timeout: e.target.value ? parseInt(e.target.value) : undefined })
            }}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      </CardContent>
    </Card>
  )
} 