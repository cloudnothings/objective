import { models } from "./ai/models";
import type { TokenBreakdown, TokenUsage } from "@/types/dashboard";

export type ModelInfo = {
  id: string;
  inputCost: number; // per million tokens
  outputCost: number; // per million tokens
  maxTokens: number;
  maxOutputTokens: number;
  knowledgeCutoffDate: string;
  supports?: {
    reasoning?: boolean;
  };
};

export type CostEstimate = {
  inputCost: number;
  estimatedOutputCost: number;
  totalEstimatedCost: number;
  exceedsMaxTokens: boolean;
  suggestedAlternatives?: ModelInfo[];
};

export type ActualCost = {
  inputCost: number;
  outputCost: number;
  totalCost: number;
};

// Get model information by ID
export const getModelInfo = (modelId: string): ModelInfo | null => {
  return models.find((model) => model.id === modelId) ?? null;
};

// Get all available models
export const getAvailableModels = (): ModelInfo[] => {
  return models;
};

// Calculate cost in dollars from tokens and cost per million
const calculateCost = (tokens: number, costPerMillion: number): number => {
  return (tokens / 1_000_000) * costPerMillion;
};

// Estimate cost for a generation
export const estimateCost = (
  inputTokens: number,
  estimatedOutputTokens: number,
  modelId: string,
): CostEstimate => {
  const model = getModelInfo(modelId);

  if (!model) {
    return {
      inputCost: 0,
      estimatedOutputCost: 0,
      totalEstimatedCost: 0,
      exceedsMaxTokens: false,
    };
  }

  const inputCost = calculateCost(inputTokens, model.inputCost);
  const estimatedOutputCost = calculateCost(
    estimatedOutputTokens,
    model.outputCost,
  );
  const totalEstimatedCost = inputCost + estimatedOutputCost;

  // Check if context exceeds model limits
  const exceedsMaxTokens = inputTokens > model.maxTokens;

  // Suggest alternatives if context is too large
  let suggestedAlternatives: ModelInfo[] = [];
  if (exceedsMaxTokens) {
    suggestedAlternatives = models
      .filter((m) => m.maxTokens > inputTokens && m.id !== modelId)
      .sort((a, b) => a.inputCost - b.inputCost) // Sort by cost, cheapest first
      .slice(0, 3); // Top 3 alternatives
  }

  return {
    inputCost,
    estimatedOutputCost,
    totalEstimatedCost,
    exceedsMaxTokens,
    suggestedAlternatives:
      suggestedAlternatives.length > 0 ? suggestedAlternatives : undefined,
  };
};

// Calculate actual cost from API response
export const calculateActualCost = (
  tokenUsage: TokenUsage,
  modelId: string,
): ActualCost | null => {
  const model = getModelInfo(modelId);

  if (!model || !tokenUsage.actualInputTokens || !tokenUsage.outputTokens) {
    return null;
  }

  const inputCost = calculateCost(
    tokenUsage.actualInputTokens,
    model.inputCost,
  );
  const outputCost = calculateCost(tokenUsage.outputTokens, model.outputCost);
  const totalCost = inputCost + outputCost;

  return {
    inputCost,
    outputCost,
    totalCost,
  };
};

// Format cost for display
export const formatCost = (cost: number): string => {
  if (cost < 0.001) {
    return "<$0.001";
  }
  return `$${cost.toFixed(3)}`;
};

// Check if cost warrants a warning (>= $1.00)
export const shouldWarnAboutCost = (cost: number): boolean => {
  return cost >= 1.0;
};

// Estimate output tokens based on input (rough heuristic)
export const estimateOutputTokens = (
  inputTokens: number,
  hasSchema: boolean,
): number => {
  // Basic heuristic: structured output tends to be shorter than input
  // With schema: typically 10-50% of input tokens
  // Without schema: could be similar to input tokens
  if (hasSchema) {
    return Math.min(Math.max(inputTokens * 0.3, 50), 4000); // 30% of input, min 50, max 4000
  } else {
    return Math.min(inputTokens * 0.8, 8000); // 80% of input, max 8000
  }
};
