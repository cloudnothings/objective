"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Key, Eye, EyeOff, DollarSign, Trash2 } from "lucide-react"
import { formatCost } from "@/lib/cost-utils"

interface ApiConfigProps {
  className?: string
}

export function ApiConfig({ className }: ApiConfigProps) {
  const [apiKey, setApiKey] = useState("")
  const [showKey, setShowKey] = useState(false)
  const [totalSpent, setTotalSpent] = useState(0)
  const [isEditing, setIsEditing] = useState(false)

  // Load data from localStorage on mount
  useEffect(() => {
    const storedKey = localStorage.getItem("openai_api_key")
    const storedSpent = localStorage.getItem("openai_total_spent")

    if (storedKey) {
      setApiKey(storedKey)
    }
    if (storedSpent) {
      setTotalSpent(parseFloat(storedSpent))
    }

    // Listen for cost updates
    const handleCostUpdate = (event: CustomEvent<{ newTotal: number }>) => {
      if (event.detail?.newTotal !== undefined) {
        setTotalSpent(event.detail.newTotal)
      }
    }

    window.addEventListener("openai-cost-updated", handleCostUpdate as EventListener)

    return () => {
      window.removeEventListener("openai-cost-updated", handleCostUpdate as EventListener)
    }
  }, [])

  const handleSaveKey = () => {
    if (apiKey.trim()) {
      localStorage.setItem("openai_api_key", apiKey.trim())
      setIsEditing(false)
    }
  }

  const handleRemoveKey = () => {
    if (window.confirm("Remove API key? This will prevent new generations until you add a new key.")) {
      localStorage.removeItem("openai_api_key")
      setApiKey("")
      setIsEditing(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSaveKey()
    }
    if (e.key === "Escape") {
      setIsEditing(false)
      // Reset to stored value
      const storedKey = localStorage.getItem("openai_api_key")
      setApiKey(storedKey ?? "")
    }
  }

  const maskedKey = apiKey ? `${apiKey.slice(0, 7)}${"*".repeat(Math.max(0, apiKey.length - 11))}${apiKey.slice(-4)}` : ""

  return (
    <Card className={`h-8 max-w-full overflow-hidden ${className}`}>
      <div className="h-8 flex items-center px-2 gap-3">
        <div className="flex items-center gap-1.5 text-xs font-mono text-gray-600 dark:text-gray-400">
          <Key className="h-3 w-3" />
          <span>{formatCost(totalSpent)}</span>
        </div>

        <div className="flex items-center flex-1 min-w-0">
          {!apiKey && !isEditing ? (
            <Button
              variant="outline"
              onClick={() => setIsEditing(true)}
              className="h-6 px-2 border-dashed text-xs font-mono text-gray-500 hover:text-gray-700 hover:border-gray-400 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:border-gray-500 transition-all duration-200"
            >
              add openai key
            </Button>
          ) : isEditing ? (
            <div className="flex gap-1 flex-1">
              <Input
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-..."
                className="h-6 text-xs font-mono flex-1 min-w-0"
                onKeyDown={handleKeyPress}
                autoFocus
              />
              <Button
                variant="outline"
                onClick={handleSaveKey}
                className="h-6 px-2 text-xs"
                disabled={!apiKey.trim()}
              >
                Save
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div
                className="flex-1 min-w-0 text-xs font-mono text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 rounded px-2 py-0.5 truncate cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                onClick={() => setShowKey(!showKey)}
                title={showKey ? "Click to hide key" : "Click to show key"}
              >
                {showKey ? apiKey : maskedKey}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="h-6 px-2 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                Edit
              </Button>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}

// Utility functions for other components to use
export const getStoredApiKey = (): string | null => {
  if (typeof window === "undefined") return null
  return localStorage.getItem("openai_api_key")
}

export const addToTotalSpent = (cost: number): void => {
  if (typeof window === "undefined") return
  const current = parseFloat(localStorage.getItem("openai_total_spent") ?? "0")
  const newTotal = current + cost
  localStorage.setItem("openai_total_spent", newTotal.toString())

  // Dispatch a custom event to update UI
  window.dispatchEvent(new CustomEvent("openai-cost-updated", { detail: { newTotal } }))
}

export const getTotalSpent = (): number => {
  if (typeof window === "undefined") return 0
  return parseFloat(localStorage.getItem("openai_total_spent") ?? "0")
} 