import { useCallback } from "react";
import { generateId } from "ai";
import { useDashboardStore } from "@/store/dashboard-store";
import {
  generateAiObject,
  generateSystemMessage,
  generateZodSchema,
  generateSystemAndSchema,
  type GenerateResult,
} from "@/app/actions";
import { validateZodSchema, generateSchemaString } from "@/lib/schema-utils";
import { getTokenCounts } from "@/lib/token-utils";
import {
  estimateCost,
  estimateOutputTokens,
  calculateActualCost,
} from "@/lib/cost-utils";
import { getStoredApiKey, addToTotalSpent } from "@/components/ui/api-config";
import type {
  GeneratorCardType,
  OutputCardType,
  TokenUsage,
  TokenBreakdown,
  CostInfo,
  GenerationReference,
} from "@/types/dashboard";

export const useDashboardActions = () => {
  const {
    getActiveInputData,
    addOutputCard,
    updateOutputCard,
    updateGeneratorCard,
    updateGeneratorRawSchema,
    setImportError,
    setSystemMessageDialog,
    setSchemaDialog,
    setFullConfigDialog,
    setIsGeneratingSystem,
    setIsGeneratingSchema,
    setIsGeneratingFullConfig,
    setCopiedId,
    commitInputCardVersion,
    commitGeneratorCardVersion,
    addStringInputCard,
    updateStringInputCard,
    setActiveInputId,
    executeFetchRequest,
    inputCards,
    generatorCards,
    activeInputId,
  } = useDashboardStore();

  const handleImportSchema = useCallback(
    async (id: string) => {
      try {
        // In v0, we'll use a prompt instead of clipboard
        const schemaText = prompt("Paste your Zod schema here:");
        if (!schemaText) return;

        const validation = validateZodSchema(schemaText);

        if (!validation.isValid) {
          setImportError(validation.error ?? "Invalid schema");
          setTimeout(() => setImportError(null), 5000);
          return;
        }

        // Store as raw schema
        updateGeneratorRawSchema(id, schemaText.trim());
        setImportError(null);
      } catch (error) {
        setImportError("Failed to import schema");
        setTimeout(() => setImportError(null), 5000);
      }
    },
    [updateGeneratorRawSchema, setImportError],
  );

  const handleGenerateSystemMessage = useCallback(
    async (prompt: string) => {
      const { systemMessageDialog, generatorCards } =
        useDashboardStore.getState();
      if (!systemMessageDialog.cardId) return;

      // Find the current generator card to get its model
      const currentCard = generatorCards.find(
        (card) => card.id === systemMessageDialog.cardId,
      );
      if (!currentCard) {
        setImportError("Generator card not found.");
        setTimeout(() => setImportError(null), 5000);
        return;
      }

      setIsGeneratingSystem(true);
      try {
        const apiKey = getStoredApiKey();
        if (!apiKey) {
          setImportError(
            "No OpenAI API key found. Please add your API key in the configuration section.",
          );
          setTimeout(() => setImportError(null), 5000);
          return;
        }

        const generatedMessage = await generateSystemMessage(
          prompt,
          apiKey,
          currentCard.model,
        );
        updateGeneratorCard(systemMessageDialog.cardId, {
          systemMessage: generatedMessage,
        });
        setSystemMessageDialog({ open: false, cardId: null });
      } catch (error) {
        setImportError(
          error instanceof Error
            ? error.message
            : "Failed to generate system message",
        );
        setTimeout(() => setImportError(null), 5000);
      } finally {
        setIsGeneratingSystem(false);
      }
    },
    [
      updateGeneratorCard,
      setSystemMessageDialog,
      setImportError,
      setIsGeneratingSystem,
    ],
  );

  const handleGenerateSchema = useCallback(
    async (prompt: string) => {
      const { schemaDialog, generatorCards } = useDashboardStore.getState();
      if (!schemaDialog.cardId) return;

      // Find the current generator card to get its model
      const currentCard = generatorCards.find(
        (card) => card.id === schemaDialog.cardId,
      );
      if (!currentCard) {
        setImportError("Generator card not found.");
        setTimeout(() => setImportError(null), 5000);
        return;
      }

      setIsGeneratingSchema(true);
      try {
        const apiKey = getStoredApiKey();
        if (!apiKey) {
          setImportError(
            "No OpenAI API key found. Please add your API key in the configuration section.",
          );
          setTimeout(() => setImportError(null), 5000);
          return;
        }

        const generatedSchema = await generateZodSchema(
          prompt,
          apiKey,
          currentCard.model,
        );
        const validation = validateZodSchema(generatedSchema);

        if (!validation.isValid) {
          setImportError(`Generated invalid schema: ${validation.error}`);
          setTimeout(() => setImportError(null), 5000);
          return;
        }

        // Store as raw schema and clear fields
        updateGeneratorRawSchema(schemaDialog.cardId, generatedSchema);
        setSchemaDialog({ open: false, cardId: null });
      } catch (error) {
        setImportError(
          error instanceof Error ? error.message : "Failed to generate schema",
        );
        setTimeout(() => setImportError(null), 5000);
      } finally {
        setIsGeneratingSchema(false);
      }
    },
    [
      updateGeneratorRawSchema,
      setSchemaDialog,
      setImportError,
      setIsGeneratingSchema,
    ],
  );

  const handleGenerateFullConfig = useCallback(
    async (prompt: string) => {
      const { fullConfigDialog, generatorCards } = useDashboardStore.getState();
      if (!fullConfigDialog.cardId) return;

      // Find the current generator card to get its model
      const currentCard = generatorCards.find(
        (card) => card.id === fullConfigDialog.cardId,
      );
      if (!currentCard) {
        setImportError("Generator card not found.");
        setTimeout(() => setImportError(null), 5000);
        return;
      }

      setIsGeneratingFullConfig(true);
      try {
        const apiKey = getStoredApiKey();
        if (!apiKey) {
          setImportError(
            "No OpenAI API key found. Please add your API key in the configuration section.",
          );
          setTimeout(() => setImportError(null), 5000);
          return;
        }

        const { systemMessage, schema } = await generateSystemAndSchema(
          prompt,
          apiKey,
          currentCard.model,
        );

        // Validate the generated schema
        const validation = validateZodSchema(schema);
        if (!validation.isValid) {
          setImportError(`Generated invalid schema: ${validation.error}`);
          setTimeout(() => setImportError(null), 5000);
          return;
        }

        // Update both system message and schema
        updateGeneratorCard(fullConfigDialog.cardId, {
          systemMessage,
          rawSchema: schema,
          schemaFields: [],
        });

        setFullConfigDialog({ open: false, cardId: null });
      } catch (error) {
        setImportError(
          error instanceof Error
            ? error.message
            : "Failed to generate configuration",
        );
        setTimeout(() => setImportError(null), 5000);
      } finally {
        setIsGeneratingFullConfig(false);
      }
    },
    [
      updateGeneratorCard,
      setFullConfigDialog,
      setImportError,
      setIsGeneratingFullConfig,
    ],
  );

  const handleGenerate = useCallback(
    async (generatorCard: GeneratorCardType) => {
      const state = useDashboardStore.getState();

      // Find the active input card
      const activeInputCard = state.inputCards.find(
        (card) => card.id === state.activeInputId,
      );
      if (!activeInputCard) {
        alert("No active input card found.");
        return;
      }

      // If active card is a fetch request, execute it first
      if (activeInputCard.type === "fetch") {
        try {
          // Execute the fetch request (this will create a new string card and set it as active)
          await executeFetchRequest(activeInputCard.id);

          // Wait a moment for the state to update
          await new Promise((resolve) => setTimeout(resolve, 100));

          // Get the updated state to find the new active card
          const updatedState = useDashboardStore.getState();
          const newActiveCard = updatedState.inputCards.find(
            (card) => card.id === updatedState.activeInputId,
          );

          if (!newActiveCard || newActiveCard.type !== "string") {
            alert("Failed to create string input from fetch request.");
            return;
          }
        } catch (error) {
          alert(
            `Fetch request failed: ${error instanceof Error ? error.message : "Unknown error"}`,
          );
          return;
        }
      }

      // Now get the active data (either from original string card or newly created one)
      const activeData = getActiveInputData();
      if (!activeData.trim()) {
        alert("No data available for generation.");
        return;
      }

      // Get the current active input card (might be different now if we executed a fetch)
      const currentState = useDashboardStore.getState();
      const currentActiveCard = currentState.inputCards.find(
        (card) => card.id === currentState.activeInputId,
      );
      if (!currentActiveCard) {
        alert("No active input card found after processing.");
        return;
      }

      // Commit versions if there are unsaved changes
      let inputCardVersion: number;
      let generatorCardVersion: number;

      if (currentActiveCard.hasUnsavedChanges) {
        inputCardVersion = commitInputCardVersion(currentActiveCard.id);
      } else {
        // Use current committed version
        inputCardVersion = currentActiveCard.currentVersion ?? 1;
      }

      if (generatorCard.hasUnsavedChanges) {
        generatorCardVersion = commitGeneratorCardVersion(generatorCard.id);
      } else {
        // Use current committed version
        generatorCardVersion = generatorCard.currentVersion ?? 1;
      }

      // Create generation reference with committed data
      const generationReference: GenerationReference = {
        inputCardId: currentActiveCard.id,
        inputCardVersion,
        generatorCardId: generatorCard.id,
        generatorCardVersion,
        inputData: activeData,
        generatorConfig: {
          label: generatorCard.label,
          systemMessage: generatorCard.systemMessage,
          schemaFields: [...generatorCard.schemaFields],
          rawSchema: generatorCard.rawSchema,
          model: generatorCard.model,
        },
      };

      const outputId = generateId();
      const schemaString = generateSchemaString(generatorCard);

      // Calculate expected token counts
      const tokenBreakdown: TokenBreakdown = getTokenCounts(
        activeData,
        generatorCard,
        schemaString,
      );

      // Calculate cost estimate
      const hasSchema =
        generatorCard.schemaFields.length > 0 || !!generatorCard.rawSchema;
      const estimatedOutputTokens = estimateOutputTokens(
        tokenBreakdown.total,
        hasSchema,
      );
      const costEstimate = estimateCost(
        tokenBreakdown.total,
        estimatedOutputTokens,
        generatorCard.model,
      );

      const costInfo: CostInfo = {
        estimatedCost: costEstimate.totalEstimatedCost,
        inputCost: costEstimate.inputCost,
        exceedsMaxTokens: costEstimate.exceedsMaxTokens,
        suggestedAlternatives: costEstimate.suggestedAlternatives?.map(
          (alt) => alt.id,
        ),
      };

      const newOutputCard: OutputCardType = {
        id: outputId,
        generatorId: generatorCard.id,
        data: null,
        error: null,
        isLoading: true,
        tokenBreakdown,
        tokenUsage: {
          expectedInputTokens: tokenBreakdown.total,
        },
        costInfo,
        generationReference,
      };
      addOutputCard(newOutputCard);

      try {
        const apiKey = getStoredApiKey();
        if (!apiKey) {
          updateOutputCard(outputId, {
            error:
              "No OpenAI API key found. Please add your API key in the configuration section above.",
            isLoading: false,
          });
          return;
        }

        const startTime = Date.now();
        const result: GenerateResult = await generateAiObject(
          activeData,
          generatorCard.model,
          generatorCard.systemMessage,
          schemaString,
          apiKey,
        );
        const generationTime = Date.now() - startTime;

        // Create updated token usage with actual values
        const tokenUsage: TokenUsage = {
          expectedInputTokens: tokenBreakdown.total,
          actualInputTokens: result.tokenUsage?.promptTokens,
          outputTokens: result.tokenUsage?.completionTokens,
          totalTokens: result.tokenUsage?.totalTokens,
        };

        // Calculate actual cost if we have usage data
        const actualCost = calculateActualCost(tokenUsage, generatorCard.model);
        const updatedCostInfo: CostInfo = {
          ...costInfo,
          actualCost: actualCost?.totalCost,
          outputCost: actualCost?.outputCost,
        };

        // Track spending in localStorage
        if (actualCost?.totalCost) {
          addToTotalSpent(actualCost.totalCost);
        }

        updateOutputCard(outputId, {
          data: result.object as object,
          isLoading: false,
          tokenUsage,
          costInfo: updatedCostInfo,
          generationTime,
        });
      } catch (e) {
        const error =
          e instanceof Error ? e.message : "An unknown error occurred.";
        updateOutputCard(outputId, { error: error, isLoading: false });
      }
    },
    [
      getActiveInputData,
      addOutputCard,
      updateOutputCard,
      commitInputCardVersion,
      commitGeneratorCardVersion,
      executeFetchRequest,
    ],
  );

  const handleCopy = useCallback(
    async (outputId: string, data: object) => {
      if (!data) return;
      const jsonString = JSON.stringify(data, null, 2);
      try {
        await navigator.clipboard.writeText(jsonString);
        setCopiedId(outputId);
        setTimeout(() => {
          setCopiedId(null);
        }, 2000);
      } catch (error) {
        console.error("Failed to copy to clipboard:", error);
      }
    },
    [setCopiedId],
  );

  const handleCreateInputCard = useCallback(
    async (data: string) => {
      // Create a new string input card with the provided data
      addStringInputCard();

      // Get the newly created card (it will be at the front of the array)
      const state = useDashboardStore.getState();
      const newCard = state.inputCards[0];

      if (newCard) {
        // Update the card with the provided data
        updateStringInputCard(newCard.id, data);
        // Make it the active card
        setActiveInputId(newCard.id);
      }
    },
    [addStringInputCard, updateStringInputCard, setActiveInputId],
  );

  return {
    handleImportSchema,
    handleGenerateSystemMessage,
    handleGenerateSchema,
    handleGenerateFullConfig,
    handleGenerate,
    handleCopy,
    handleCreateInputCard,
  };
};
