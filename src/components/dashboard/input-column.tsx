import { useDashboardStore } from "@/store/dashboard-store"
import { InputCards } from "@/components/dashboard/input-cards"
import type { FetchRequestConfig } from "@/types/dashboard"

export default function InputColumn() {
  const {
    inputCards,
    activeInputId,
    updateInputCard,
    updateStringInputCard,
    updateFetchRequestInputCard,
    setActiveInputId,
    addStringInputCard,
    addFetchRequestInputCard,
    deleteInputCard,
    switchInputCardToVersion,
    revertInputCardToLatestVersion,
    executeFetchRequest,
  } = useDashboardStore()

  const handleAddStringInput = () => {
    addStringInputCard()
  }

  const handleAddFetchInput = () => {
    addFetchRequestInputCard()
  }

  const handleInputChange = (id: string, data: string) => {
    updateStringInputCard(id, data)
  }

  const handleFetchConfigChange = (id: string, config: FetchRequestConfig) => {
    updateFetchRequestInputCard(id, config)
  }

  const handleLabelChange = (id: string, label: string) => {
    updateInputCard(id, { label })
  }

  const handleSelectInput = (id: string) => {
    setActiveInputId(id)
  }

  const handleDeleteInput = (idToDelete: string) => {
    if (inputCards.length <= 1) return

    if (window.confirm("Are you sure you want to delete this input?")) {
      deleteInputCard(idToDelete)
    }
  }

  const handleExecuteFetch = async (id: string) => {
    try {
      await executeFetchRequest(id)
    } catch (error) {
      console.error("Fetch error:", error)
      alert(`Fetch failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  return (
    <InputCards
      inputCards={inputCards}
      activeInputId={activeInputId}
      onInputChange={handleInputChange}
      onFetchConfigChange={handleFetchConfigChange}
      onLabelChange={handleLabelChange}
      onSelectInput={handleSelectInput}
      onAddStringInput={handleAddStringInput}
      onAddFetchInput={handleAddFetchInput}
      onDeleteInput={handleDeleteInput}
      onVersionSelect={switchInputCardToVersion}
      onRevertToLatest={revertInputCardToLatestVersion}
      onExecuteFetch={handleExecuteFetch}
    />
  )
}