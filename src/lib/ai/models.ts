export const models = [
  // Latest GPT-4.1 Series
  {
    id: "gpt-4.1",
    inputCost: 2.0,
    outputCost: 8.0,
    maxTokens: 1047576,
    maxOutputTokens: 32768,
    knowledgeCutoffDate: "2024-06-01",
  },
  {
    id: "gpt-4.1-mini",
    inputCost: 0.4,
    outputCost: 1.6,
    maxTokens: 1047576,
    maxOutputTokens: 32768,
    knowledgeCutoffDate: "2024-06-01",
  },
  {
    id: "gpt-4.1-nano",
    inputCost: 0.1,
    outputCost: 0.4,
    maxTokens: 1047576,
    maxOutputTokens: 32768,
    knowledgeCutoffDate: "2024-06-01",
  },

  // GPT-4.5 Preview
  {
    id: "gpt-4.5-preview",
    inputCost: 75.0,
    outputCost: 150.0,
    maxTokens: 128000,
    maxOutputTokens: 16384,
    knowledgeCutoffDate: "2023-10-01",
  },

  // o3 Series (Latest Reasoning Models)
  {
    id: "o3",
    inputCost: 2.0,
    outputCost: 8.0,
    maxTokens: 200000,
    maxOutputTokens: 100000,
    knowledgeCutoffDate: "2024-06-01",
    supports: {
      reasoning: true,
    },
  },
  {
    id: "o3-pro",
    inputCost: 20.0,
    outputCost: 80.0,
    maxTokens: 200000,
    maxOutputTokens: 100000,
    knowledgeCutoffDate: "2024-06-01",
    supports: {
      reasoning: true,
    },
  },
  {
    id: "o3-mini",
    inputCost: 1.1,
    outputCost: 4.4,
    maxTokens: 200000,
    maxOutputTokens: 100000,
    knowledgeCutoffDate: "2023-10-01",
  },

  // o4 Series
  {
    id: "o4-mini",
    inputCost: 0.6,
    outputCost: 2.4,
    maxTokens: 200000,
    maxOutputTokens: 100000,
    knowledgeCutoffDate: "2024-06-01",
  },

  // o1 Series (Reasoning Models)
  {
    id: "o1",
    inputCost: 15.0,
    outputCost: 60.0,
    maxTokens: 200000,
    maxOutputTokens: 100000,
    knowledgeCutoffDate: "2023-10-01",
  },
  {
    id: "o1-mini",
    inputCost: 1.1,
    outputCost: 4.4,
    maxTokens: 128000,
    maxOutputTokens: 65536,
    knowledgeCutoffDate: "2023-10-01",
    supports: {
      reasoning: true,
    },
  },

  // GPT-4o Series
  {
    id: "gpt-4o",
    inputCost: 2.5,
    outputCost: 10.0,
    maxTokens: 128000,
    maxOutputTokens: 16384,
    knowledgeCutoffDate: "2023-10-01",
  },
  {
    id: "gpt-4o-2024-11-20",
    inputCost: 2.5,
    outputCost: 10.0,
    maxTokens: 128000,
    maxOutputTokens: 16384,
    knowledgeCutoffDate: "2023-10-01",
  },
  {
    id: "gpt-4o-2024-08-06",
    inputCost: 2.5,
    outputCost: 10.0,
    maxTokens: 128000,
    maxOutputTokens: 16384,
    knowledgeCutoffDate: "2023-10-01",
  },
  {
    id: "gpt-4o-2024-05-13",
    inputCost: 5.0,
    outputCost: 15.0,
    maxTokens: 128000,
    maxOutputTokens: 4096,
    knowledgeCutoffDate: "2023-10-01",
  },
  {
    id: "o4-mini-2025-04-16",
    inputCost: 0.15,
    outputCost: 0.6,
    maxTokens: 128000,
    maxOutputTokens: 16384,
    knowledgeCutoffDate: "2023-10-01",
  },
  {
    id: "chatgpt-4o-latest",
    inputCost: 5.0,
    outputCost: 15.0,
    maxTokens: 128000,
    maxOutputTokens: 16384,
    knowledgeCutoffDate: "2023-10-01",
  },
];
