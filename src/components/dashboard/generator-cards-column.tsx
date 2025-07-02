import { useDashboardStore } from "@/store/dashboard-store"
import { useDashboardActions } from "@/hooks/use-dashboard-actions"
import { GeneratorCards } from "@/components/dashboard/generator-cards"
import { generateSchemaString, canParseSchema } from "@/lib/schema-utils"
import { getAvailableModels } from "@/lib/cost-utils"
import { type GeneratorCardType } from "@/types/dashboard"

export default function GeneratorCardsColumn() {
  const {
    generatorCards,
    importError,
    updateGeneratorCard,
    addGeneratorCard,
    deleteGeneratorCard,
    clearGeneratorSchema,
    setEditingSchemaForCardId,
    setEditingRawSchemaForCardId,
    setSystemMessageDialog,
    setSchemaDialog,
    setFullConfigDialog,
    switchGeneratorCardToVersion,
    revertGeneratorCardToLatestVersion,
  } = useDashboardStore()

  const { handleImportSchema, handleGenerate } = useDashboardActions()

  const handleGeneratorChange = (
    id: string,
    field: keyof Omit<GeneratorCardType, "id" | "schemaFields" | "rawSchema" | "versions" | "currentVersion" | "hasUnsavedChanges">,
    value: string,
  ) => {
    updateGeneratorCard(id, { [field]: value })
  }

  const handleDeleteGeneratorCard = (idToDelete: string) => {
    const cardToDelete = generatorCards.find((c) => c.id === idToDelete)
    if (
      window.confirm(
        `Are you sure you want to delete ${cardToDelete?.label}? This will also remove its outputs.`,
      )
    ) {
      deleteGeneratorCard(idToDelete)
    }
  }

  const handleClearSchema = (id: string) => {
    if (window.confirm("Clear the current schema? This cannot be undone.")) {
      clearGeneratorSchema(id)
    }
  }

  return (
    <GeneratorCards
      generatorCards={generatorCards}
      onGeneratorChange={handleGeneratorChange}
      onDeleteGeneratorCard={handleDeleteGeneratorCard}
      onAddGeneratorCard={addGeneratorCard}
      onGenerate={handleGenerate}
      onImportSchema={handleImportSchema}
      onClearSchema={handleClearSchema}
      onEditSchema={(id) => setEditingSchemaForCardId(id)}
      onEditRawSchema={(id) => setEditingRawSchemaForCardId(id)}
      onOpenSystemMessageDialog={(cardId) => setSystemMessageDialog({ open: true, cardId })}
      onOpenSchemaDialog={(cardId) => setSchemaDialog({ open: true, cardId })}
      onOpenFullConfigDialog={(cardId) => setFullConfigDialog({ open: true, cardId })}
      generateSchemaString={generateSchemaString}
      canParseSchema={canParseSchema}
      importError={importError}
      onVersionSelect={switchGeneratorCardToVersion}
      onRevertToLatest={revertGeneratorCardToLatestVersion}
    />
  )
}