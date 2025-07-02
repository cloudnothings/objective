"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Plus, Code, Globe } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { InputCard } from "./input-card"
import type { InputCardType, StringInputCardType, FetchRequestInputCardType, FetchRequestConfig } from "@/types/dashboard"

export function InputCardsDemo() {
  const [inputCards, setInputCards] = useState<InputCardType[]>([
    {
      id: "string-1",
      type: "string",
      label: "Sample Text",
      data: "This is a sample string input card. You can edit this text and it will be used for generation.",
      versions: [],
      currentVersion: null,
      hasUnsavedChanges: true,
    },
    {
      id: "fetch-1",
      type: "fetch",
      label: "Pokemon API Request",
      fetchConfig: {
        url: "https://pokeapi.co/api/v2/pokemon/pikachu",
        method: "GET",
        headers: {
          "Accept": "application/json",
        },
        timeout: 10000,
      },
      versions: [],
      currentVersion: null,
      hasUnsavedChanges: true,
    }
  ] as InputCardType[])

  const [activeInputId, setActiveInputId] = useState<string | null>("string-1")
  const [tokenVisualizationEnabled, setTokenVisualizationEnabled] = useState<Record<string, boolean>>({})

  const toggleTokenVisualization = (cardId: string) => {
    setTokenVisualizationEnabled(prev => ({
      ...prev,
      [cardId]: !prev[cardId]
    }))
  }

  const handleInputChange = (id: string, data: string) => {
    setInputCards(cards => cards.map(card =>
      card.id === id && card.type === "string"
        ? { ...card, data, hasUnsavedChanges: true }
        : card
    ))
  }

  const handleFetchConfigChange = (id: string, config: FetchRequestConfig) => {
    setInputCards(cards => cards.map(card =>
      card.id === id && card.type === "fetch"
        ? { ...card, fetchConfig: config, hasUnsavedChanges: true }
        : card
    ))
  }

  const handleLabelChange = (id: string, label: string) => {
    setInputCards(cards => cards.map(card =>
      card.id === id ? { ...card, label, hasUnsavedChanges: true } : card
    ))
  }

  const handleSelectInput = (id: string) => {
    setActiveInputId(id)
  }

  const handleDeleteInput = (idToDelete: string) => {
    if (inputCards.length <= 1) return
    setInputCards(cards => cards.filter(card => card.id !== idToDelete))
    if (activeInputId === idToDelete) {
      const remaining = inputCards.filter(card => card.id !== idToDelete)
      setActiveInputId(remaining.length > 0 ? remaining[0]!.id : null)
    }
  }

  const handleVersionSelect = (id: string, version: number | null) => {
    // Mock implementation
    console.log(`Version select for ${id}: ${version}`)
  }

  const handleRevertToLatest = (id: string) => {
    // Mock implementation  
    console.log(`Revert to latest for ${id}`)
  }

  const handleExecuteFetch = async (id: string) => {
    const card = inputCards.find(c => c.id === id && c.type === "fetch") as FetchRequestInputCardType | undefined
    if (!card) return

    try {
      if (!card.fetchConfig.url.trim()) {
        alert("Please enter a URL")
        return
      }

      const fetchOptions: RequestInit = {
        method: card.fetchConfig.method,
        headers: Object.fromEntries(
          Object.entries(card.fetchConfig.headers).filter(([key, value]) => key.trim() && value.trim())
        ),
      }

      if (card.fetchConfig.method !== "GET" && card.fetchConfig.body) {
        fetchOptions.body = card.fetchConfig.body
      }

      if (card.fetchConfig.timeout) {
        const controller = new AbortController()
        setTimeout(() => controller.abort(), card.fetchConfig.timeout)
        fetchOptions.signal = controller.signal
      }

      const response = await fetch(card.fetchConfig.url, fetchOptions)
      const responseText = await response.text()

      // Create a new string input card with the response
      const newStringCard: StringInputCardType = {
        id: crypto.randomUUID(),
        type: "string",
        label: `${card.label} response`,
        data: responseText,
        versions: [],
        currentVersion: null,
        hasUnsavedChanges: true,
      }

      setInputCards(cards => [newStringCard, ...cards])
      setActiveInputId(newStringCard.id)

    } catch (error) {
      console.error("Fetch error:", error)
      alert(`Fetch failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const addStringInput = () => {
    const newCard: StringInputCardType = {
      id: crypto.randomUUID(),
      type: "string",
      label: `input ${inputCards.length + 1}`,
      data: "",
      versions: [],
      currentVersion: null,
      hasUnsavedChanges: true,
    }
    setInputCards(cards => [newCard, ...cards])
    setActiveInputId(newCard.id)
  }

  const addFetchInput = () => {
    const newCard: FetchRequestInputCardType = {
      id: crypto.randomUUID(),
      type: "fetch",
      label: `fetch ${inputCards.filter(c => c.type === "fetch").length + 1}`,
      fetchConfig: {
        url: "https://pokeapi.co/api/v2/pokemon/pikachu",
        method: "GET",
        headers: {
          "Accept": "application/json",
        },
        timeout: 10000,
      },
      versions: [],
      currentVersion: null,
      hasUnsavedChanges: true,
    }
    setInputCards(cards => [newCard, ...cards])
    setActiveInputId(newCard.id)
  }

  return (
    <div className="flex flex-col h-full space-y-1 w-full">
      <div className="flex gap-1">
        <Button
          variant="outline"
          className="h-8 border-dashed border-2 text-xs font-mono text-gray-500 hover:text-gray-700 hover:border-gray-400 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:border-gray-500 flex-shrink-0 transition-all duration-200 flex-1"
          onClick={addStringInput}
        >
          <Code className="h-3.5 w-3.5 mr-1.5" />
          add string
        </Button>

        <Button
          variant="outline"
          className="h-8 border-dashed border-2 text-xs font-mono text-orange-500 hover:text-orange-700 hover:border-orange-400 dark:text-orange-400 dark:hover:text-orange-300 dark:hover:border-orange-500 flex-shrink-0 transition-all duration-200 flex-1"
          onClick={addFetchInput}
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
                  onInputChange={handleInputChange}
                  onFetchConfigChange={handleFetchConfigChange}
                  onLabelChange={handleLabelChange}
                  onSelectInput={handleSelectInput}
                  onDeleteInput={handleDeleteInput}
                  onVersionSelect={handleVersionSelect}
                  onRevertToLatest={handleRevertToLatest}
                  onToggleTokenVisualization={toggleTokenVisualization}
                  onExecuteFetch={handleExecuteFetch}
                />
              )
            })}
          </div>
        </ScrollArea>
      </div>
    </div>
  )
} 