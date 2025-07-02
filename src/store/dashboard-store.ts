import { create } from "zustand";
import { generateId } from "ai";
import type {
  InputCardType,
  StringInputCardType,
  FetchRequestInputCardType,
  InputCardVersion,
  StringInputCardVersion,
  FetchRequestInputCardVersion,
  GeneratorCardType,
  GeneratorCardVersion,
  OutputCardType,
  SchemaField,
  DialogState,
  FetchRequestConfig,
} from "@/types/dashboard";

const defaultSchemaFields: SchemaField[] = [
  {
    id: generateId(),
    name: "summary",
    type: "string",
    description: "A brief summary of the text.",
  },
  {
    id: generateId(),
    name: "actionItems",
    type: "array",
    arrayType: "object",
    description: "A list of action items from the text.",
    arrayObjectFields: [
      {
        id: generateId(),
        name: "task",
        type: "string",
        description: "The action to be taken.",
      },
      {
        id: generateId(),
        name: "assignee",
        type: "string",
        description: "Who is responsible for the task.",
      },
    ],
  },
];

interface DashboardState {
  // Input cards state
  inputCards: InputCardType[];
  activeInputId: string | null;

  // Generator cards state
  generatorCards: GeneratorCardType[];

  // Output cards state
  outputCards: OutputCardType[];

  // UI state
  copiedId: string | null;
  editingSchemaForCardId: string | null;
  editingRawSchemaForCardId: string | null;
  importError: string | null;

  // Dialog states
  systemMessageDialog: DialogState;
  schemaDialog: DialogState;
  fullConfigDialog: DialogState;
  isGeneratingSystem: boolean;
  isGeneratingSchema: boolean;
  isGeneratingFullConfig: boolean;
}

interface DashboardActions {
  // Input card actions
  addInputCard: (type?: "string" | "fetch") => void;
  addStringInputCard: () => void;
  addFetchRequestInputCard: () => void;
  deleteInputCard: (id: string) => void;
  updateInputCard: (
    id: string,
    data: Partial<
      Omit<InputCardType, "versions" | "currentVersion" | "hasUnsavedChanges">
    >,
  ) => void;
  updateStringInputCard: (id: string, data: string) => void;
  updateFetchRequestInputCard: (id: string, config: FetchRequestConfig) => void;
  setActiveInputId: (id: string | null) => void;
  getActiveInputData: () => string;
  executeFetchRequest: (id: string) => Promise<void>;

  // Generator card actions
  addGeneratorCard: () => void;
  deleteGeneratorCard: (id: string) => void;
  updateGeneratorCard: (
    id: string,
    updates: Partial<
      Omit<
        GeneratorCardType,
        "versions" | "currentVersion" | "hasUnsavedChanges"
      >
    >,
  ) => void;
  updateGeneratorSchema: (id: string, fields: SchemaField[]) => void;
  updateGeneratorRawSchema: (id: string, rawSchema: string) => void;
  clearGeneratorSchema: (id: string) => void;

  // Version management actions
  commitInputCardVersion: (id: string) => number; // Returns the new version number
  commitGeneratorCardVersion: (id: string) => number; // Returns the new version number
  switchInputCardToVersion: (id: string, version: number | null) => void; // null = working version
  switchGeneratorCardToVersion: (id: string, version: number | null) => void; // null = working version
  revertInputCardToLatestVersion: (id: string) => void;
  revertGeneratorCardToLatestVersion: (id: string) => void;
  getInputCardVersion: (id: string, version: number) => InputCardVersion | null;
  getGeneratorCardVersion: (
    id: string,
    version: number,
  ) => GeneratorCardVersion | null;

  // Output card actions
  addOutputCard: (card: OutputCardType) => void;
  updateOutputCard: (id: string, updates: Partial<OutputCardType>) => void;

  // UI actions
  setCopiedId: (id: string | null) => void;
  setEditingSchemaForCardId: (id: string | null) => void;
  setEditingRawSchemaForCardId: (id: string | null) => void;
  setImportError: (error: string | null) => void;

  // Dialog actions
  setSystemMessageDialog: (state: DialogState) => void;
  setSchemaDialog: (state: DialogState) => void;
  setFullConfigDialog: (state: DialogState) => void;
  setIsGeneratingSystem: (loading: boolean) => void;
  setIsGeneratingSchema: (loading: boolean) => void;
  setIsGeneratingFullConfig: (loading: boolean) => void;
}

type DashboardStore = DashboardState & DashboardActions;

// Helper function to create initial string input card with version
const createInitialStringInputCard = (
  id: string,
  label: string,
  data: string,
): StringInputCardType => {
  const initialVersion: StringInputCardVersion = {
    id,
    version: 1,
    type: "string",
    label,
    data,
    createdAt: new Date(),
  };

  return {
    id,
    type: "string",
    label,
    data,
    versions: [initialVersion],
    currentVersion: 1,
    hasUnsavedChanges: false,
  };
};

// Helper function to create initial fetch request input card with version
const createInitialFetchRequestInputCard = (
  id: string,
  label: string,
  fetchConfig: FetchRequestConfig,
): FetchRequestInputCardType => {
  const initialVersion: FetchRequestInputCardVersion = {
    id,
    version: 1,
    type: "fetch",
    label,
    fetchConfig,
    createdAt: new Date(),
  };

  return {
    id,
    type: "fetch",
    label,
    fetchConfig,
    versions: [initialVersion],
    currentVersion: 1,
    hasUnsavedChanges: false,
  };
};

const createInitialGeneratorCard = (
  id: string,
  label: string,
): GeneratorCardType => {
  const initialVersion: GeneratorCardVersion = {
    id,
    version: 1,
    label,
    systemMessage:
      "You are a helpful assistant that extracts structured data from user input.",
    schemaFields: defaultSchemaFields,
    rawSchema: null,
    model: "gpt-4.1-nano",
    createdAt: new Date(),
  };

  return {
    id,
    label,
    systemMessage:
      "You are a helpful assistant that extracts structured data from user input.",
    schemaFields: defaultSchemaFields,
    rawSchema: null,
    model: "gpt-4.1-nano",
    versions: [initialVersion],
    currentVersion: 1,
    hasUnsavedChanges: false,
  };
};

// Helper function to check if card has unsaved changes
const hasInputCardChanges = (card: InputCardType): boolean => {
  if (card.currentVersion === null) return true; // Working version always has "changes"
  const currentVersionData = card.versions.find(
    (v) => v.version === card.currentVersion,
  );
  if (!currentVersionData) return true;

  if (card.type === "string" && currentVersionData.type === "string") {
    return (
      card.label !== currentVersionData.label ||
      card.data !== currentVersionData.data
    );
  }

  if (card.type === "fetch" && currentVersionData.type === "fetch") {
    return (
      card.label !== currentVersionData.label ||
      JSON.stringify(card.fetchConfig) !==
        JSON.stringify(currentVersionData.fetchConfig)
    );
  }

  return true; // Different types means changes
};

const hasGeneratorCardChanges = (card: GeneratorCardType): boolean => {
  if (card.currentVersion === null) return true; // Working version always has "changes"
  const currentVersionData = card.versions.find(
    (v) => v.version === card.currentVersion,
  );
  if (!currentVersionData) return true;

  return (
    card.label !== currentVersionData.label ||
    card.systemMessage !== currentVersionData.systemMessage ||
    card.model !== currentVersionData.model ||
    card.rawSchema !== currentVersionData.rawSchema ||
    JSON.stringify(card.schemaFields) !==
      JSON.stringify(currentVersionData.schemaFields)
  );
};

export const useDashboardStore = create<DashboardStore>((set, get) => {
  const initialInputId = generateId();

  return {
    // Initial state with versioning
    inputCards: [
      createInitialStringInputCard(
        initialInputId,
        "input",
        "Vercel is a platform for frontend developers, providing the speed and reliability innovators need to create at the moment of inspiration.",
      ),
    ],
    activeInputId: initialInputId,
    generatorCards: [
      createInitialGeneratorCard(generateId(), "Default Extractor"),
    ],
    outputCards: [],
    copiedId: null,
    editingSchemaForCardId: null,
    editingRawSchemaForCardId: null,
    importError: null,
    systemMessageDialog: { open: false, cardId: null },
    schemaDialog: { open: false, cardId: null },
    fullConfigDialog: { open: false, cardId: null },
    isGeneratingSystem: false,
    isGeneratingSchema: false,
    isGeneratingFullConfig: false,

    // Actions
    addInputCard: (type: "string" | "fetch" = "string") => {
      if (type === "fetch") {
        get().addFetchRequestInputCard();
      } else {
        get().addStringInputCard();
      }
    },

    addStringInputCard: () => {
      const { inputCards } = get();
      const newId = generateId();
      const newCard = createInitialStringInputCard(
        newId,
        `input ${inputCards.length + 1}`,
        "",
      );
      set((state) => ({
        inputCards: [newCard, ...state.inputCards],
        activeInputId: newCard.id,
      }));
    },

    addFetchRequestInputCard: () => {
      const { inputCards } = get();
      const newId = generateId();
      const newCard = createInitialFetchRequestInputCard(
        newId,
        `fetch ${inputCards.filter((c) => c.type === "fetch").length + 1}`,
        {
          url: "https://pokeapi.co/api/v2/pokemon/pikachu",
          method: "GET",
          headers: {
            Accept: "application/json",
          },
          timeout: 10000,
        },
      );
      set((state) => ({
        inputCards: [newCard, ...state.inputCards],
        activeInputId: newCard.id,
      }));
    },

    deleteInputCard: (idToDelete: string) => {
      const { inputCards, activeInputId } = get();
      if (inputCards.length <= 1) return;

      const remainingCards = inputCards.filter(
        (card) => card.id !== idToDelete,
      );
      const newActiveId =
        activeInputId === idToDelete
          ? remainingCards.length > 0
            ? remainingCards[0]!.id
            : null
          : activeInputId;

      set({
        inputCards: remainingCards,
        activeInputId: newActiveId,
      });
    },

    updateInputCard: (
      id: string,
      updates: Partial<
        Omit<InputCardType, "versions" | "currentVersion" | "hasUnsavedChanges">
      >,
    ) => {
      set((state) => ({
        inputCards: state.inputCards.map((card) => {
          if (card.id === id) {
            const updatedCard = { ...card, ...updates } as InputCardType;
            return {
              ...updatedCard,
              hasUnsavedChanges: hasInputCardChanges(updatedCard),
            };
          }
          return card;
        }),
      }));
    },

    updateStringInputCard: (id: string, data: string) => {
      set((state) => ({
        inputCards: state.inputCards.map((card) => {
          if (card.id === id && card.type === "string") {
            const updatedCard = { ...card, data };
            return {
              ...updatedCard,
              hasUnsavedChanges: hasInputCardChanges(updatedCard),
            };
          }
          return card;
        }),
      }));
    },

    updateFetchRequestInputCard: (id: string, config: FetchRequestConfig) => {
      set((state) => ({
        inputCards: state.inputCards.map((card) => {
          if (card.id === id && card.type === "fetch") {
            const updatedCard = { ...card, fetchConfig: config };
            return {
              ...updatedCard,
              hasUnsavedChanges: hasInputCardChanges(updatedCard),
            };
          }
          return card;
        }),
      }));
    },

    setActiveInputId: (id: string | null) => {
      set({ activeInputId: id });
    },

    getActiveInputData: () => {
      const { inputCards, activeInputId } = get();
      const activeCard = inputCards.find((card) => card.id === activeInputId);
      if (activeCard?.type === "string") {
        return activeCard.data;
      }
      return "";
    },

    executeFetchRequest: async (id: string) => {
      const { inputCards } = get();
      const card = inputCards.find((c) => c.id === id && c.type === "fetch") as
        | FetchRequestInputCardType
        | undefined;
      if (!card) return;

      try {
        if (!card.fetchConfig.url.trim()) {
          throw new Error("Please enter a URL");
        }

        const fetchOptions: RequestInit = {
          method: card.fetchConfig.method,
          headers: Object.fromEntries(
            Object.entries(card.fetchConfig.headers).filter(
              ([key, value]) => key.trim() && value.trim(),
            ),
          ),
        };

        if (card.fetchConfig.method !== "GET" && card.fetchConfig.body) {
          fetchOptions.body = card.fetchConfig.body;
        }

        if (card.fetchConfig.timeout) {
          const controller = new AbortController();
          setTimeout(() => controller.abort(), card.fetchConfig.timeout);
          fetchOptions.signal = controller.signal;
        }

        const response = await fetch(card.fetchConfig.url, fetchOptions);
        const responseText = await response.text();

        // Create a new string input card with the response
        const newId = generateId();
        const newStringCard = createInitialStringInputCard(
          newId,
          `${card.label} response`,
          responseText,
        );

        set((state) => ({
          inputCards: [newStringCard, ...state.inputCards],
          activeInputId: newStringCard.id,
        }));
      } catch (error) {
        console.error("Fetch error:", error);
        throw error;
      }
    },

    addGeneratorCard: () => {
      const { generatorCards } = get();
      const newId = generateId();
      const newCard = createInitialGeneratorCard(
        newId,
        `Generator ${generatorCards.length + 1}`,
      );
      // Override the default system message for new cards
      newCard.systemMessage =
        "You are an expert data analyst who focuses on conciseness.";
      newCard.versions[0]!.systemMessage = newCard.systemMessage;

      set((state) => ({
        generatorCards: [newCard, ...state.generatorCards],
      }));
    },

    deleteGeneratorCard: (idToDelete: string) => {
      set((state) => ({
        generatorCards: state.generatorCards.filter(
          (card) => card.id !== idToDelete,
        ),
        outputCards: state.outputCards.filter(
          (output) => output.generatorId !== idToDelete,
        ),
      }));
    },

    updateGeneratorCard: (
      id: string,
      updates: Partial<
        Omit<
          GeneratorCardType,
          "versions" | "currentVersion" | "hasUnsavedChanges"
        >
      >,
    ) => {
      set((state) => ({
        generatorCards: state.generatorCards.map((card) => {
          if (card.id === id) {
            const updatedCard = { ...card, ...updates };
            return {
              ...updatedCard,
              hasUnsavedChanges: hasGeneratorCardChanges(updatedCard),
            };
          }
          return card;
        }),
      }));
    },

    updateGeneratorSchema: (id: string, fields: SchemaField[]) => {
      set((state) => ({
        generatorCards: state.generatorCards.map((card) => {
          if (card.id === id) {
            const updatedCard = { ...card, schemaFields: fields };
            // Only clear rawSchema if we actually have fields to replace it with
            if (fields.length > 0) {
              updatedCard.rawSchema = null;
            }
            return {
              ...updatedCard,
              hasUnsavedChanges: hasGeneratorCardChanges(updatedCard),
            };
          }
          return card;
        }),
      }));
    },

    updateGeneratorRawSchema: (id: string, rawSchema: string) => {
      set((state) => ({
        generatorCards: state.generatorCards.map((card) => {
          if (card.id === id) {
            const updatedCard = { ...card, rawSchema, schemaFields: [] };
            return {
              ...updatedCard,
              hasUnsavedChanges: hasGeneratorCardChanges(updatedCard),
            };
          }
          return card;
        }),
      }));
    },

    clearGeneratorSchema: (id: string) => {
      set((state) => ({
        generatorCards: state.generatorCards.map((card) => {
          if (card.id === id) {
            const updatedCard = { ...card, schemaFields: [], rawSchema: null };
            return {
              ...updatedCard,
              hasUnsavedChanges: hasGeneratorCardChanges(updatedCard),
            };
          }
          return card;
        }),
      }));
    },

    // Version management actions
    commitInputCardVersion: (id: string) => {
      let newVersionNumber = 1;
      set((state) => ({
        inputCards: state.inputCards.map((card) => {
          if (card.id === id) {
            newVersionNumber =
              Math.max(...card.versions.map((v) => v.version)) + 1;

            let newVersion: InputCardVersion;
            if (card.type === "string") {
              newVersion = {
                id: card.id,
                version: newVersionNumber,
                type: "string",
                label: card.label,
                data: card.data,
                createdAt: new Date(),
              };
            } else {
              newVersion = {
                id: card.id,
                version: newVersionNumber,
                type: "fetch",
                label: card.label,
                fetchConfig: card.fetchConfig,
                createdAt: new Date(),
              };
            }

            return {
              ...card,
              versions: [...card.versions, newVersion],
              currentVersion: newVersionNumber,
              hasUnsavedChanges: false,
            };
          }
          return card;
        }),
      }));
      return newVersionNumber;
    },

    commitGeneratorCardVersion: (id: string) => {
      let newVersionNumber = 1;
      set((state) => ({
        generatorCards: state.generatorCards.map((card) => {
          if (card.id === id) {
            newVersionNumber =
              Math.max(...card.versions.map((v) => v.version)) + 1;
            const newVersion: GeneratorCardVersion = {
              id: card.id,
              version: newVersionNumber,
              label: card.label,
              systemMessage: card.systemMessage,
              schemaFields: [...card.schemaFields],
              rawSchema: card.rawSchema,
              model: card.model,
              createdAt: new Date(),
            };
            return {
              ...card,
              versions: [...card.versions, newVersion],
              currentVersion: newVersionNumber,
              hasUnsavedChanges: false,
            };
          }
          return card;
        }),
      }));
      return newVersionNumber;
    },

    switchInputCardToVersion: (id: string, version: number | null) => {
      set((state) => ({
        inputCards: state.inputCards.map((card) => {
          if (card.id === id) {
            if (version === null) {
              // Switch to working version - keep current data but mark as working
              return {
                ...card,
                currentVersion: null,
                hasUnsavedChanges: true,
              };
            } else {
              const versionData = card.versions.find(
                (v) => v.version === version,
              );
              if (versionData) {
                if (card.type === "string" && versionData.type === "string") {
                  return {
                    ...card,
                    label: versionData.label,
                    data: versionData.data,
                    currentVersion: version,
                    hasUnsavedChanges: false,
                  };
                } else if (
                  card.type === "fetch" &&
                  versionData.type === "fetch"
                ) {
                  return {
                    ...card,
                    label: versionData.label,
                    fetchConfig: versionData.fetchConfig,
                    currentVersion: version,
                    hasUnsavedChanges: false,
                  };
                }
              }
            }
          }
          return card;
        }),
      }));
    },

    switchGeneratorCardToVersion: (id: string, version: number | null) => {
      set((state) => ({
        generatorCards: state.generatorCards.map((card) => {
          if (card.id === id) {
            if (version === null) {
              // Switch to working version - keep current data but mark as working
              return {
                ...card,
                currentVersion: null,
                hasUnsavedChanges: true,
              };
            } else {
              const versionData = card.versions.find(
                (v) => v.version === version,
              );
              if (versionData) {
                return {
                  ...card,
                  label: versionData.label,
                  systemMessage: versionData.systemMessage,
                  schemaFields: [...versionData.schemaFields],
                  rawSchema: versionData.rawSchema,
                  model: versionData.model,
                  currentVersion: version,
                  hasUnsavedChanges: false,
                };
              }
            }
          }
          return card;
        }),
      }));
    },

    revertInputCardToLatestVersion: (id: string) => {
      const { inputCards } = get();
      const card = inputCards.find((c) => c.id === id);
      if (card && card.versions.length > 0) {
        const latestVersion = Math.max(...card.versions.map((v) => v.version));
        get().switchInputCardToVersion(id, latestVersion);
      }
    },

    revertGeneratorCardToLatestVersion: (id: string) => {
      const { generatorCards } = get();
      const card = generatorCards.find((c) => c.id === id);
      if (card && card.versions.length > 0) {
        const latestVersion = Math.max(...card.versions.map((v) => v.version));
        get().switchGeneratorCardToVersion(id, latestVersion);
      }
    },

    getInputCardVersion: (id: string, version: number) => {
      const { inputCards } = get();
      const card = inputCards.find((c) => c.id === id);
      return card?.versions.find((v) => v.version === version) ?? null;
    },

    getGeneratorCardVersion: (id: string, version: number) => {
      const { generatorCards } = get();
      const card = generatorCards.find((c) => c.id === id);
      return card?.versions.find((v) => v.version === version) ?? null;
    },

    addOutputCard: (card: OutputCardType) => {
      set((state) => ({
        outputCards: [card, ...state.outputCards],
      }));
    },

    updateOutputCard: (id: string, updates: Partial<OutputCardType>) => {
      set((state) => ({
        outputCards: state.outputCards.map((card) =>
          card.id === id ? { ...card, ...updates } : card,
        ),
      }));
    },

    setCopiedId: (id: string | null) => {
      set({ copiedId: id });
    },

    setEditingSchemaForCardId: (id: string | null) => {
      set({ editingSchemaForCardId: id });
    },

    setEditingRawSchemaForCardId: (id: string | null) => {
      set({ editingRawSchemaForCardId: id });
    },

    setImportError: (error: string | null) => {
      set({ importError: error });
    },

    setSystemMessageDialog: (state: DialogState) => {
      set({ systemMessageDialog: state });
    },

    setSchemaDialog: (state: DialogState) => {
      set({ schemaDialog: state });
    },

    setFullConfigDialog: (state: DialogState) => {
      set({ fullConfigDialog: state });
    },

    setIsGeneratingSystem: (loading: boolean) => {
      set({ isGeneratingSystem: loading });
    },

    setIsGeneratingSchema: (loading: boolean) => {
      set({ isGeneratingSchema: loading });
    },

    setIsGeneratingFullConfig: (loading: boolean) => {
      set({ isGeneratingFullConfig: loading });
    },
  };
});
