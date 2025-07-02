import { useDashboardStore } from "@/store/dashboard-store"
import { useDashboardActions } from "@/hooks/use-dashboard-actions"
import { OutputCards } from "@/components/dashboard/output-cards"

export default function OutputCardsColumn() {
  const {
    outputCards,
    generatorCards,
    copiedId,
  } = useDashboardStore()

  const { handleCopy, handleCreateInputCard } = useDashboardActions()

  return (
    <div className="flex flex-col h-full space-y-1">
      <div className="flex-1 overflow-hidden">
        <OutputCards
          outputCards={outputCards}
          generatorCards={generatorCards}
          onCopy={handleCopy}
          onCreateInputCard={handleCreateInputCard}
          copiedId={copiedId}
        />
      </div>
    </div>
  )
}