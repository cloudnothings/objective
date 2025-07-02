import type { GeneratorCardType } from "@/types/dashboard";

// Rough but reliable token estimation function
// Based on OpenAI's guidance that 1 token ≈ 4 characters for English text
const estimateTokens = (text: string): number => {
  if (!text || text.trim() === "") return 0;

  // More sophisticated estimation:
  // - Count words and characters
  // - Adjust for common patterns
  const words = text.trim().split(/\s+/).length;
  const chars = text.length;

  // Use a combination of character and word-based estimation
  // This gives better results than pure character division
  const charBasedEstimate = Math.ceil(chars / 4);
  const wordBasedEstimate = Math.ceil(words * 1.3); // ~1.3 tokens per word on average

  // Use the higher estimate as it's usually more accurate
  return Math.max(charBasedEstimate, wordBasedEstimate);
};

export const countTokens = (text: string, model = "gpt-4o"): number => {
  return estimateTokens(text);
};

export const countInputTokens = (
  inputData: string,
  model = "gpt-4o",
): number => {
  return countTokens(inputData, model);
};

export const countSystemMessageTokens = (
  systemMessage: string,
  model = "gpt-4o",
): number => {
  return countTokens(systemMessage, model);
};

export const countSchemaTokens = (
  schemaString: string,
  model = "gpt-4o",
): number => {
  return countTokens(schemaString, model);
};

export const countTotalInputTokens = (
  inputData: string,
  systemMessage: string,
  schemaString: string,
  model = "gpt-4o",
): number => {
  const inputTokens = countInputTokens(inputData, model);
  const systemTokens = countSystemMessageTokens(systemMessage, model);
  const schemaTokens = countSchemaTokens(schemaString, model);

  // Add some overhead for message formatting and structure
  const overhead = 10; // approximate overhead for chat completion formatting

  return inputTokens + systemTokens + schemaTokens + overhead;
};

export interface TokenCounts {
  input: number;
  systemMessage: number;
  schema: number;
  total: number;
}

export const getTokenCounts = (
  inputData: string,
  generatorCard: GeneratorCardType,
  schemaString: string,
): TokenCounts => {
  const model = generatorCard.model;

  const input = countInputTokens(inputData, model);
  const systemMessage = countSystemMessageTokens(
    generatorCard.systemMessage,
    model,
  );
  const schema = countSchemaTokens(schemaString, model);
  const total = input + systemMessage + schema + 10; // overhead

  return {
    input,
    systemMessage,
    schema,
    total,
  };
};
