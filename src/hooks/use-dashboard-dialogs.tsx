import { useDashboardStore } from "@/store/dashboard-store"
import { useDashboardActions } from "@/hooks/use-dashboard-actions"
import { parseSimpleSchema, generateSchemaString } from "@/lib/schema-utils"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { SchemaBuilder } from "@/components/dashboard/schema-builder"
import { SchemaEditor } from "@/components/dashboard/schema-editor"
import { AiPromptDialog } from "@/components/ui/ai-prompt-dialog"
import type { SchemaField } from "@/types/dashboard"

export const useDashboardDialogs = () => {
  const {
    generatorCards,
    editingSchemaForCardId,
    editingRawSchemaForCardId,
    systemMessageDialog,
    schemaDialog,
    fullConfigDialog,
    isGeneratingSystem,
    isGeneratingSchema,
    isGeneratingFullConfig,
    setEditingSchemaForCardId,
    setEditingRawSchemaForCardId,
    setSystemMessageDialog,
    setSchemaDialog,
    setFullConfigDialog,
    updateGeneratorSchema,
    updateGeneratorRawSchema,
  } = useDashboardStore()

  const {
    handleGenerateSystemMessage,
    handleGenerateSchema,
    handleGenerateFullConfig,
  } = useDashboardActions()

  const cardBeingEdited = generatorCards.find((card) => card.id === editingSchemaForCardId)
  const cardBeingRawEdited = generatorCards.find((card) => card.id === editingRawSchemaForCardId)

  const dialogs = (
    <>
      {/* Schema Builder Dialog */}
      {cardBeingEdited && (
        <Dialog
          open={editingSchemaForCardId !== null}
          onOpenChange={(isOpen) => {
            if (!isOpen) {
              setEditingSchemaForCardId(null)
            }
          }}
        >
          <DialogContent className="max-w-3xl h-[90vh] flex flex-col">
            <DialogHeader className="p-3">
              <DialogTitle className="font-mono text-base">schema builder: {cardBeingEdited.label}</DialogTitle>
              <DialogDescription className="text-xs font-mono">
                {cardBeingEdited.rawSchema ? "editing generated schema" : "visual schema builder"}
              </DialogDescription>
            </DialogHeader>
            <div className="flex-grow overflow-y-auto p-3 custom-scrollbar">
              {cardBeingEdited.rawSchema && parseSimpleSchema(cardBeingEdited.rawSchema).length === 0 ? (
                <div className="space-y-3">
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 p-3 rounded text-xs font-mono">
                    <p className="font-semibold">Complex Schema Detected</p>
                    <p>This schema is too complex for the visual builder. Use the raw editor (code icon) instead.</p>
                  </div>
                  <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded">
                    <pre className="text-xs font-mono whitespace-pre-wrap">{cardBeingEdited.rawSchema}</pre>
                  </div>
                </div>
              ) : (
                <SchemaBuilder
                  value={
                    cardBeingEdited.rawSchema
                      ? parseSimpleSchema(cardBeingEdited.rawSchema)
                      : cardBeingEdited.schemaFields
                  }
                  onChange={(fields) => updateGeneratorSchema(cardBeingEdited.id, fields)}
                />
              )}
            </div>
            <DialogFooter className="p-2 border-t">
              <Button size="sm" onClick={() => setEditingSchemaForCardId(null)} className="h-7 text-xs font-mono">
                done
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Raw Schema Editor Dialog */}
      {cardBeingRawEdited && (
        <Dialog
          open={editingRawSchemaForCardId !== null}
          onOpenChange={(isOpen) => {
            if (!isOpen) {
              setEditingRawSchemaForCardId(null)
            }
          }}
        >
          <DialogContent className="max-w-3xl flex flex-col">
            <DialogHeader>
              <DialogTitle className="font-mono text-base">raw schema editor: {cardBeingRawEdited.label}</DialogTitle>
            </DialogHeader>
            <div className="flex-grow overflow-y-auto">
              <SchemaEditor
                value={generateSchemaString(cardBeingRawEdited)}
                onChange={(newSchema) => updateGeneratorRawSchema(cardBeingRawEdited.id, newSchema)}
              />
            </div>
            <DialogFooter className="p-2 border-t">
              <Button size="sm" onClick={() => setEditingRawSchemaForCardId(null)} className="h-7 text-xs font-mono">
                done
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* AI System Message Dialog */}
      <AiPromptDialog
        open={systemMessageDialog.open}
        onOpenChange={(open) => setSystemMessageDialog({ open, cardId: open ? systemMessageDialog.cardId : null })}
        title="generate system message"
        description="describe what the AI should do"
        placeholder="extract key insights from business documents..."
        onGenerate={handleGenerateSystemMessage}
        isLoading={isGeneratingSystem}
      />

      {/* AI Schema Dialog */}
      <AiPromptDialog
        open={schemaDialog.open}
        onOpenChange={(open) => setSchemaDialog({ open, cardId: open ? schemaDialog.cardId : null })}
        title="generate zod schema"
        description="describe the data structure you want"
        placeholder="user profile with name, email, preferences..."
        onGenerate={handleGenerateSchema}
        isLoading={isGeneratingSchema}
      />

      {/* AI Full Configuration Dialog */}
      <AiPromptDialog
        open={fullConfigDialog.open}
        onOpenChange={(open) => setFullConfigDialog({ open, cardId: open ? fullConfigDialog.cardId : null })}
        title="generate complete config"
        description="describe what you want to extract or analyze"
        placeholder="analyze customer feedback and extract sentiment, topics, and action items..."
        onGenerate={handleGenerateFullConfig}
        isLoading={isGeneratingFullConfig}
      />
    </>
  )

  return { dialogs }
} 