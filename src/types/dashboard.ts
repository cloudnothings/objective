export type SchemaField = {
  id: string;
  name: string;
  type: "string" | "number" | "boolean" | "array" | "enum" | "object";
  description: string;
  enumValues?: string[];
  arrayType?: "string" | "number" | "boolean" | "object";
  objectFields?: SchemaField[];
  arrayObjectFields?: SchemaField[];
};

// Base types for input cards
export type FetchRequestConfig = {
  url: string;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  headers: Record<string, string>;
  body?: string;
  timeout?: number;
};

// Versioned card types - these represent committed versions
export type InputCardVersionBase = {
  id: string;
  version: number;
  label: string;
  createdAt: Date;
};

export type StringInputCardVersion = InputCardVersionBase & {
  type: "string";
  data: string;
};

export type FetchRequestInputCardVersion = InputCardVersionBase & {
  type: "fetch";
  fetchConfig: FetchRequestConfig;
};

export type InputCardVersion =
  | StringInputCardVersion
  | FetchRequestInputCardVersion;

export type GeneratorCardVersion = {
  id: string;
  version: number;
  label: string;
  systemMessage: string;
  schemaFields: SchemaField[];
  rawSchema: string | null;
  model: string;
  createdAt: Date;
};

// Current working card types - these can be modified without committing
export type InputCardTypeBase = {
  id: string;
  label: string;
  versions: InputCardVersion[];
  currentVersion: number | null; // null means working version
  hasUnsavedChanges: boolean;
};

export type StringInputCardType = InputCardTypeBase & {
  type: "string";
  data: string;
};

export type FetchRequestInputCardType = InputCardTypeBase & {
  type: "fetch";
  fetchConfig: FetchRequestConfig;
};

export type InputCardType = StringInputCardType | FetchRequestInputCardType;

export type GeneratorCardType = {
  id: string;
  label: string;
  systemMessage: string;
  schemaFields: SchemaField[];
  rawSchema: string | null;
  model: string;
  versions: GeneratorCardVersion[];
  currentVersion: number | null; // null means working version
  hasUnsavedChanges: boolean;
};

export type TokenUsage = {
  expectedInputTokens: number;
  actualInputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
};

export type TokenBreakdown = {
  input: number;
  systemMessage: number;
  schema: number;
  total: number;
};

export type CostInfo = {
  estimatedCost: number;
  actualCost?: number;
  inputCost?: number;
  outputCost?: number;
  exceedsMaxTokens?: boolean;
  suggestedAlternatives?: string[];
};

// Reference to specific versions used in generation
export type GenerationReference = {
  inputCardId: string;
  inputCardVersion: number;
  generatorCardId: string;
  generatorCardVersion: number;
  inputData: string;
  generatorConfig: {
    label: string;
    systemMessage: string;
    schemaFields: SchemaField[];
    rawSchema: string | null;
    model: string;
  };
};

export type OutputCardType = {
  id: string;
  generatorId: string; // Still kept for backward compatibility
  data: object | null;
  error: string | null;
  isLoading: boolean;
  tokenUsage?: TokenUsage;
  tokenBreakdown?: TokenBreakdown;
  costInfo?: CostInfo;
  generationReference?: GenerationReference; // New: references the exact versions used
  generationTime?: number; // Time in milliseconds
};

export type DialogState = {
  open: boolean;
  cardId: string | null;
};

import { models } from "@/lib/ai/models";

export const AVAILABLE_MODELS = models.map((model) => model.id);

export type Model = string;
