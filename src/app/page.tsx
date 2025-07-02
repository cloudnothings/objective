"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Loader2,
  ChevronsRight,
  Copy,

} from "lucide-react"
import { generateAiObject, generateSystemMessage, generateZodSchema, generateSystemAndSchema } from "./actions"
import { SchemaBuilder } from "@/components/ui/schema-builder"
import { SchemaEditor } from "@/components/ui/schema-editor"
import { AiPromptDialog } from "@/components/ui/ai-prompt-dialog"
import { GeneratorCards, type GeneratorCardType } from "@/components/ui/generator-cards"
import { generateId } from "ai"

// Types
export type SchemaField = {
  id: string
  name: string
  type: "string" | "number" | "boolean" | "array" | "enum" | "object"
  description: string
  enumValues?: string[]
  arrayType?: "string" | "number" | "boolean" | "object"
  objectFields?: SchemaField[]
  arrayObjectFields?: SchemaField[]
}

type OutputCardType = {
  id: number
  generatorId: number
  data: object | null
  error: string | null
  isLoading: boolean
}

const defaultSchemaFields: SchemaField[] = [
  { id: generateId(), name: "summary", type: "string", description: "A brief summary of the text." },
  {
    id: generateId(),
    name: "actionItems",
    type: "array",
    arrayType: "object",
    description: "A list of action items from the text.",
    arrayObjectFields: [
      { id: generateId(), name: "task", type: "string", description: "The action to be taken." },
      { id: generateId(), name: "assignee", type: "string", description: "Who is responsible for the task." },
    ],
  },
]

const availableModels = ["gpt-4o", "gpt-4-turbo", "o1", "o3-mini", "gpt-4.5-preview"]

const generateSchemaStringRecursive = (fields: SchemaField[], indentLevel = 1): string => {
  const indent = "  ".repeat(indentLevel)
  const closingIndent = "  ".repeat(indentLevel - 1)

  const fieldStrings = fields
    .filter((field) => field.name.trim() !== "")
    .map((field) => {
      let typeString: string
      switch (field.type) {
        case "array":
          if (field.arrayType === "object") {
            typeString = `z.array(${generateSchemaStringRecursive(field.arrayObjectFields ?? [], indentLevel + 1)})`
          } else {
            typeString = `z.array(z.${field.arrayType ?? "string"}())`
          }
          break
        case "enum":
          const enumValues = field.enumValues?.map((v) => `"${v.trim().replace(/"/g, '\\"')}"`).join(", ") ?? ""
          if (!enumValues) {
            typeString = `z.enum(["PLACEHOLDER"])`
          } else {
            typeString = `z.enum([${enumValues}])`
          }
          break
        case "object":
          typeString = generateSchemaStringRecursive(field.objectFields ?? [], indentLevel + 1)
          break
        default:
          typeString = `z.${field.type}()`
      }

      if (field.description.trim() !== "") {
        typeString += `.describe("${field.description.trim().replace(/"/g, '\\"')}")`
      }

      return `${indent}${field.name.trim()}: ${typeString}`
    })
    .join(",\n")

  return `z.object({\n${fieldStrings}\n${closingIndent}})`
}

const generateSchemaString = (card: GeneratorCardType): string => {
  // Use raw schema if available, otherwise generate from fields
  if (card.rawSchema) {
    return card.rawSchema
  }

  if (!card.schemaFields || card.schemaFields.length === 0) {
    return "z.object({})"
  }
  return generateSchemaStringRecursive(card.schemaFields)
}

const validateZodSchema = (schemaString: string): { isValid: boolean; error?: string } => {
  try {
    // Basic syntax validation without executing the code
    if (!schemaString.trim().startsWith('z.')) {
      return { isValid: false, error: "Schema must start with 'z.'" }
    }

    // Check for disallowed .max() usage
    if (/\.max\s*\(/.test(schemaString)) {
      return { isValid: false, error: "Schema cannot contain .max() - this constraint is not allowed" }
    }

    // Check for balanced parentheses and braces
    let parenCount = 0;
    let braceCount = 0;
    let inString = false;
    let stringChar = '';

    for (let i = 0; i < schemaString.length; i++) {
      const char = schemaString[i];
      const prevChar = i > 0 ? schemaString[i - 1] : '';

      if (!inString && (char === '"' || char === "'" || char === '`')) {
        inString = true;
        stringChar = char;
      } else if (inString && char === stringChar && prevChar !== '\\') {
        inString = false;
        stringChar = '';
      } else if (!inString) {
        if (char === '(') parenCount++;
        else if (char === ')') parenCount--;
        else if (char === '{') braceCount++;
        else if (char === '}') braceCount--;
      }
    }

    if (parenCount !== 0) {
      return { isValid: false, error: "Unbalanced parentheses in schema" }
    }

    if (braceCount !== 0) {
      return { isValid: false, error: "Unbalanced braces in schema" }
    }

    // Check for common Zod patterns
    const hasValidZodPattern = /z\.(object|string|number|boolean|array|enum|union|literal|optional|nullable)/.test(schemaString);
    if (!hasValidZodPattern) {
      return { isValid: false, error: "Schema doesn't contain valid Zod types" }
    }

    return { isValid: true }
  } catch (error) {
    return {
      isValid: false,
      error: `Invalid schema: ${error instanceof Error ? error.message : "Unknown error"}`,
    }
  }
}

// Add this helper function near the top of the component
const canParseSchema = (rawSchema: string): boolean => {
  const parsed = parseSimpleSchema(rawSchema)
  console.log("Parsing schema:", rawSchema)
  console.log("Parsed result:", parsed)
  return parsed.length > 0
}

// Improved function to parse raw schemas back into fields
const parseSimpleSchema = (rawSchema: string): SchemaField[] => {
  try {
    // Clean up the schema string
    const cleanSchema = rawSchema.trim()

    // Match the main z.object({ ... }) structure
    const objectRegex = /z\.object\s*\(\s*\{\s*([\s\S]*?)\s*\}\s*\)/
    const objectMatch = objectRegex.exec(cleanSchema)
    if (!objectMatch) {
      console.log("No object match found")
      return []
    }

    const fieldsString = objectMatch[1]
    if (!fieldsString) {
      return []
    }
    console.log("Fields string:", fieldsString)

    // Split by commas that are not inside nested structures
    const fields: SchemaField[] = []
    let currentField = ""
    let depth = 0
    let inString = false
    let stringChar = ""

    for (let i = 0; i < fieldsString.length; i++) {
      const char = fieldsString[i]
      const prevChar = i > 0 ? fieldsString[i - 1] : ""

      if (!inString && (char === '"' || char === "'" || char === "`")) {
        inString = true
        stringChar = char
      } else if (inString && char === stringChar && prevChar !== "\\") {
        inString = false
        stringChar = ""
      } else if (!inString) {
        if (char === "{" || char === "(" || char === "[") {
          depth++
        } else if (char === "}" || char === ")" || char === "]") {
          depth--
        } else if (char === "," && depth === 0) {
          // This is a field separator
          const field = parseField(currentField.trim())
          if (field) fields.push(field)
          currentField = ""
          continue
        }
      }

      currentField += char
    }

    // Don't forget the last field
    if (currentField.trim()) {
      const field = parseField(currentField.trim())
      if (field) fields.push(field)
    }

    console.log("Final parsed fields:", fields)
    return fields
  } catch (error) {
    console.error("Schema parsing error:", error)
    return []
  }
}

// Helper function to parse individual fields
const parseField = (fieldString: string): SchemaField | null => {
  try {
    console.log("Parsing field:", fieldString)

    // Match field name and type definition
    const fieldRegex = /^(\w+)\s*:\s*(.+)$/
    const fieldMatch = fieldRegex.exec(fieldString)
    if (!fieldMatch) {
      console.log("No field match")
      return null
    }

    const name = fieldMatch[1]
    const typeDefinition = fieldMatch[2]

    if (!name || !typeDefinition) {
      return null
    }

    console.log("Field name:", name, "Type def:", typeDefinition)

    // Extract description if present
    const describeRegex = /\.describe\s*\(\s*['"`]([^'"`]*?)['"`]\s*\)/
    const describeMatch = describeRegex.exec(typeDefinition)
    const description = describeMatch?.[1] ?? ""
    console.log("Description:", description)

    // Remove the describe part to analyze the core type
    const coreType = typeDefinition.replace(/\.describe\s*\([^)]*\)/, "").trim()
    console.log("Core type:", coreType)

    // Parse different Zod types - fix the regex patterns
    const stringRegex = /^z\.string\s*\(\s*\)?$/
    if (stringRegex.exec(coreType)) {
      return {
        id: generateId(),
        name,
        type: "string",
        description,
      }
    }

    const numberRegex = /^z\.number\s*\(\s*\)?$/
    if (numberRegex.exec(coreType)) {
      return {
        id: generateId(),
        name,
        type: "number",
        description,
      }
    }

    const booleanRegex = /^z\.boolean\s*\(\s*\)?$/
    if (booleanRegex.exec(coreType)) {
      return {
        id: generateId(),
        name,
        type: "boolean",
        description,
      }
    }

    const enumRegex = /^z\.enum\s*\(/
    if (enumRegex.exec(coreType)) {
      // Parse enum values
      const enumValueRegex = /z\.enum\s*\(\s*\[\s*([^\]]*)\s*\]\s*\)/
      const enumMatch = enumValueRegex.exec(coreType)
      const enumValues = enumMatch?.[1] ? enumMatch[1].split(",").map((v) => v.trim().replace(/['"`]/g, "")) : []

      return {
        id: generateId(),
        name,
        type: "enum",
        description,
        enumValues,
      }
    }

    const arrayRegex = /^z\.array\s*\(/
    if (arrayRegex.exec(coreType)) {
      // Parse array type
      const arrayMatchRegex = /z\.array\s*\(\s*(.+?)\s*\)/
      const arrayMatch = arrayMatchRegex.exec(coreType)
      if (!arrayMatch) return null

      const arrayItemType = arrayMatch[1]?.trim()
      if (!arrayItemType) return null

      const arrayStringRegex = /^z\.string\s*\(\s*\)?$/
      if (arrayStringRegex.exec(arrayItemType)) {
        return {
          id: generateId(),
          name,
          type: "array",
          arrayType: "string",
          description,
        }
      }

      const arrayNumberRegex = /^z\.number\s*\(\s*\)?$/
      if (arrayNumberRegex.exec(arrayItemType)) {
        return {
          id: generateId(),
          name,
          type: "array",
          arrayType: "number",
          description,
        }
      }

      const arrayBooleanRegex = /^z\.boolean\s*\(\s*\)?$/
      if (arrayBooleanRegex.exec(arrayItemType)) {
        return {
          id: generateId(),
          name,
          type: "array",
          arrayType: "boolean",
          description,
        }
      }

      const arrayObjectRegex = /^z\.object\s*\(/
      if (arrayObjectRegex.exec(arrayItemType)) {
        // Parse nested object in array
        const nestedFields = parseSimpleSchema(arrayItemType)
        return {
          id: generateId(),
          name,
          type: "array",
          arrayType: "object",
          description,
          arrayObjectFields: nestedFields,
        }
      }
    }

    const objectRegex = /^z\.object\s*\(/
    if (objectRegex.exec(coreType)) {
      // Parse nested object
      const nestedFields = parseSimpleSchema(coreType)
      return {
        id: generateId(),
        name,
        type: "object",
        description,
        objectFields: nestedFields,
      }
    }

    // Default to string if we can't parse the type
    console.log("Defaulting to string for:", coreType)
    return {
      id: generateId(),
      name,
      type: "string",
      description,
    }
  } catch (error) {
    console.error("Field parsing error:", error)
    return null
  }
}

// Update the handleImportSchema function to work better in v0
const handleImportSchema = async (
  id: number,
  setGeneratorCards: React.Dispatch<React.SetStateAction<GeneratorCardType[]>>,
  setImportError: React.Dispatch<React.SetStateAction<string | null>>
) => {
  try {
    // In v0, we'll use a prompt instead of clipboard
    const schemaText = prompt("Paste your Zod schema here:")
    if (!schemaText) return

    const validation = validateZodSchema(schemaText)

    if (!validation.isValid) {
      setImportError(validation.error ?? "Invalid schema")
      setTimeout(() => setImportError(null), 5000)
      return
    }

    // Store as raw schema
    setGeneratorCards((cards) =>
      cards.map((card) => (card.id === id ? { ...card, rawSchema: schemaText.trim(), schemaFields: [] } : card)),
    )
    setImportError(null)
  } catch (error) {
    setImportError("Failed to import schema")
    setTimeout(() => setImportError(null), 5000)
  }
}

const handleSchemaChange = (
  id: number,
  fields: SchemaField[],
  setGeneratorCards: React.Dispatch<React.SetStateAction<GeneratorCardType[]>>
) => {
  setGeneratorCards((cards) =>
    cards.map((card) => {
      if (card.id === id) {
        // Only clear rawSchema if we actually have fields to replace it with
        if (fields.length > 0) {
          return { ...card, schemaFields: fields, rawSchema: null }
        } else {
          // If no fields, keep the rawSchema intact
          return { ...card, schemaFields: fields }
        }
      }
      return card
    }),
  )
}

export default function Home() {
  const [data, setData] = useState(
    "Vercel is a platform for frontend developers, providing the speed and reliability innovators need to create at the moment of inspiration.",
  )
  const [generatorCards, setGeneratorCards] = useState<GeneratorCardType[]>([
    {
      id: 1,
      label: "Default Extractor",
      systemMessage: "You are a helpful assistant that extracts structured data from user input.",
      schemaFields: defaultSchemaFields,
      rawSchema: null,
      model: "gpt-4o",
    },
  ])
  const [outputCards, setOutputCards] = useState<OutputCardType[]>([])
  const [nextGeneratorId, setNextGeneratorId] = useState(2)
  const [nextOutputId, setNextOutputId] = useState(1)
  const [copiedId, setCopiedId] = useState<number | null>(null)
  const [editingSchemaForCardId, setEditingSchemaForCardId] = useState<number | null>(null)
  const [editingRawSchemaForCardId, setEditingRawSchemaForCardId] = useState<number | null>(null)
  const [importError, setImportError] = useState<string | null>(null)

  // AI generation states
  const [systemMessageDialog, setSystemMessageDialog] = useState<{ open: boolean; cardId: number | null }>({
    open: false,
    cardId: null,
  })
  const [schemaDialog, setSchemaDialog] = useState<{ open: boolean; cardId: number | null }>({
    open: false,
    cardId: null,
  })
  const [fullConfigDialog, setFullConfigDialog] = useState<{ open: boolean; cardId: number | null }>({
    open: false,
    cardId: null,
  })
  const [isGeneratingSystem, setIsGeneratingSystem] = useState(false)
  const [isGeneratingSchema, setIsGeneratingSchema] = useState(false)
  const [isGeneratingFullConfig, setIsGeneratingFullConfig] = useState(false)

  const handleAddGeneratorCard = () => {
    setGeneratorCards([
      ...generatorCards,
      {
        id: nextGeneratorId,
        label: `Generator ${nextGeneratorId}`,
        systemMessage: "You are an expert data analyst who focuses on conciseness.",
        schemaFields: defaultSchemaFields,
        rawSchema: null,
        model: "gpt-4o",
      },
    ])
    setNextGeneratorId((prev) => prev + 1)
  }

  const handleDeleteGeneratorCard = (idToDelete: number) => {
    if (
      window.confirm(
        `Are you sure you want to delete ${generatorCards.find((c) => c.id === idToDelete)?.label}? This will also remove its outputs.`,
      )
    ) {
      setGeneratorCards((cards) => cards.filter((card) => card.id !== idToDelete))
      setOutputCards((outputs) => outputs.filter((output) => output.generatorId !== idToDelete))
    }
  }

  const handleGeneratorChange = (
    id: number,
    field: keyof Omit<GeneratorCardType, "id" | "schemaFields" | "rawSchema">,
    value: string,
  ) => {
    setGeneratorCards((cards) => cards.map((card) => (card.id === id ? { ...card, [field]: value } : card)))
  }

  const handleRawSchemaChange = (id: number, rawSchema: string) => {
    setGeneratorCards((cards) =>
      cards.map((card) => (card.id === id ? { ...card, rawSchema, schemaFields: [] } : card)),
    )
  }

  const handleClearSchema = (id: number) => {
    if (window.confirm("Clear the current schema? This cannot be undone.")) {
      setGeneratorCards((cards) =>
        cards.map((card) => (card.id === id ? { ...card, schemaFields: [], rawSchema: null } : card)),
      )
    }
  }

  const handleGenerateSystemMessage = async (prompt: string) => {
    if (!systemMessageDialog.cardId) return

    setIsGeneratingSystem(true)
    try {
      const generatedMessage = await generateSystemMessage(prompt)
      setGeneratorCards((cards) =>
        cards.map((card) =>
          card.id === systemMessageDialog.cardId ? { ...card, systemMessage: generatedMessage } : card,
        ),
      )
      setSystemMessageDialog({ open: false, cardId: null })
    } catch (error) {
      setImportError(error instanceof Error ? error.message : "Failed to generate system message")
      setTimeout(() => setImportError(null), 5000)
    } finally {
      setIsGeneratingSystem(false)
    }
  }

  const handleGenerateSchema = async (prompt: string) => {
    if (!schemaDialog.cardId) return

    setIsGeneratingSchema(true)
    try {
      const generatedSchema = await generateZodSchema(prompt)
      const validation = validateZodSchema(generatedSchema)

      if (!validation.isValid) {
        setImportError(`Generated invalid schema: ${validation.error}`)
        setTimeout(() => setImportError(null), 5000)
        return
      }

      // Store as raw schema and clear fields
      setGeneratorCards((cards) =>
        cards.map((card) =>
          card.id === schemaDialog.cardId ? { ...card, rawSchema: generatedSchema, schemaFields: [] } : card,
        ),
      )

      setSchemaDialog({ open: false, cardId: null })
    } catch (error) {
      setImportError(error instanceof Error ? error.message : "Failed to generate schema")
      setTimeout(() => setImportError(null), 5000)
    } finally {
      setIsGeneratingSchema(false)
    }
  }

  const handleGenerateFullConfig = async (prompt: string) => {
    if (!fullConfigDialog.cardId) return

    setIsGeneratingFullConfig(true)
    try {
      const { systemMessage, schema } = await generateSystemAndSchema(prompt)

      // Validate the generated schema
      const validation = validateZodSchema(schema)
      if (!validation.isValid) {
        setImportError(`Generated invalid schema: ${validation.error}`)
        setTimeout(() => setImportError(null), 5000)
        return
      }

      // Update both system message and schema
      setGeneratorCards((cards) =>
        cards.map((card) =>
          card.id === fullConfigDialog.cardId ? { ...card, systemMessage, rawSchema: schema, schemaFields: [] } : card,
        ),
      )

      setFullConfigDialog({ open: false, cardId: null })
    } catch (error) {
      setImportError(error instanceof Error ? error.message : "Failed to generate configuration")
      setTimeout(() => setImportError(null), 5000)
    } finally {
      setIsGeneratingFullConfig(false)
    }
  }

  const handleGenerate = async (generatorCard: GeneratorCardType) => {
    if (!data.trim()) {
      alert("Please enter some data in the first column.")
      return
    }

    const outputId = nextOutputId
    setNextOutputId((prev) => prev + 1)

    const newOutputCard: OutputCardType = {
      id: outputId,
      generatorId: generatorCard.id,
      data: null,
      error: null,
      isLoading: true,
    }
    setOutputCards((prev) => [newOutputCard, ...prev])

    const schemaString = generateSchemaString(generatorCard)

    try {
      const result: unknown = await generateAiObject(data, generatorCard.model, generatorCard.systemMessage, schemaString)
      setOutputCards((prev) =>
        prev.map((card) => (card.id === outputId ? { ...card, data: result as object, isLoading: false } : card)),
      )
    } catch (e) {
      const error = e instanceof Error ? e.message : "An unknown error occurred."
      setOutputCards((prev) =>
        prev.map((card) => (card.id === outputId ? { ...card, error: error, isLoading: false } : card)),
      )
    }
  }

  const handleCopy = async (outputId: number, data: object) => {
    if (!data) return
    const jsonString = JSON.stringify(data, null, 2)
    try {
      await navigator.clipboard.writeText(jsonString)
      setCopiedId(outputId)
      setTimeout(() => {
        setCopiedId(null)
      }, 2000)
    } catch (error) {
      console.error("Failed to copy to clipboard:", error)
    }
  }

  const cardBeingEdited = generatorCards.find((card) => card.id === editingSchemaForCardId)
  const cardBeingRawEdited = generatorCards.find((card) => card.id === editingRawSchemaForCardId)

  return (
    <div className="h-screen bg-gray-50 dark:bg-black p-1 flex flex-col">
      {importError && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 p-2 rounded text-xs font-mono mb-1">
          {importError}
        </div>
      )}

      <main className="grid grid-cols-1 lg:grid-cols-10 gap-1 flex-grow overflow-hidden">
        {/* Column 1: Input Data */}
        <div className="lg:col-span-2 flex flex-col h-full">
          <Card className="flex-grow flex flex-col">
            <CardHeader className="p-2">
              <CardTitle className="text-sm flex items-center gap-1.5 font-mono">
                <ChevronsRight className="h-3.5 w-3.5" />
                input
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-grow p-2 pt-0">
              <Textarea
                placeholder="paste text here..."
                className="h-full w-full resize-none text-xs bg-white dark:bg-gray-900 font-mono"
                value={data}
                onChange={(e) => setData(e.target.value)}
              />
            </CardContent>
          </Card>
        </div>

        {/* Column 2: Generator Cards */}
        <GeneratorCards
          generatorCards={generatorCards}
          onGeneratorChange={handleGeneratorChange}
          onDeleteGeneratorCard={handleDeleteGeneratorCard}
          onAddGeneratorCard={handleAddGeneratorCard}
          onGenerate={handleGenerate}
          onImportSchema={(id) => handleImportSchema(id, setGeneratorCards, setImportError)}
          onClearSchema={handleClearSchema}
          onEditSchema={(id) => setEditingSchemaForCardId(id)}
          onEditRawSchema={(id) => setEditingRawSchemaForCardId(id)}
          onOpenSystemMessageDialog={(cardId) => setSystemMessageDialog({ open: true, cardId })}
          onOpenSchemaDialog={(cardId) => setSchemaDialog({ open: true, cardId })}
          onOpenFullConfigDialog={(cardId) => setFullConfigDialog({ open: true, cardId })}
          generateSchemaString={generateSchemaString}
          canParseSchema={canParseSchema}
          importError={importError}
          availableModels={availableModels}
        />

        {/* Column 3: Output */}
        <div className="lg:col-span-4 space-y-1 overflow-y-auto custom-scrollbar pb-1 pr-0.5">
          {outputCards.length === 0 && (
            <Card className="flex items-center justify-center h-full border-dashed">
              <div className="text-center text-gray-500 text-xs font-mono">
                <p>output appears here</p>
              </div>
            </Card>
          )}
          {outputCards.map((card) => (
            <Card key={card.id}>
              <CardHeader className="p-2">
                <CardTitle className="text-sm font-mono">output</CardTitle>
                <CardDescription className="text-xs font-mono">
                  from {generatorCards.find((g) => g.id === card.generatorId)?.label ?? `gen#${card.generatorId}`}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-2 pt-0">
                {card.isLoading && (
                  <div className="flex items-center justify-center h-32">
                    <Loader2 className="h-5 w-5 animate-spin text-gray-500" />
                  </div>
                )}
                {card.error && (
                  <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 p-2 rounded text-xs font-mono space-y-2">
                    <p className="font-semibold">error</p>
                    {card.error.includes("Schema validation failed") ? (
                      <div className="space-y-1">
                        {card.error.split("Generated value:").map((part, index) => (
                          <div key={index}>
                            {index === 0 ? (
                              <p className="text-red-800 dark:text-red-200">{part.replace("Schema validation failed:", "").trim()}</p>
                            ) : (
                              <details className="mt-2">
                                <summary className="cursor-pointer font-semibold text-red-800 dark:text-red-200 hover:text-red-900 dark:hover:text-red-100">
                                  View Generated Value
                                </summary>
                                <pre className="mt-1 p-2 bg-red-100 dark:bg-red-800/30 rounded text-xs overflow-x-auto whitespace-pre-wrap">
                                  {part.trim()}
                                </pre>
                              </details>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap">{card.error}</p>
                    )}
                  </div>
                )}
                {card.data && (
                  <pre className="bg-gray-100 dark:bg-gray-800 p-2 rounded overflow-x-auto text-xs custom-scrollbar font-mono">
                    {JSON.stringify(card.data, null, 2)}
                  </pre>
                )}
              </CardContent>
              {card.data && (
                <CardFooter className="p-2">
                  <Button
                    variant="secondary"
                    className="w-full h-7 text-xs font-mono"
                    onClick={() => handleCopy(card.id, card.data!)}
                    disabled={copiedId === card.id}
                  >
                    {copiedId === card.id ? (
                      "copied!"
                    ) : (
                      <>
                        <Copy className="mr-1.5 h-3 w-3" />
                        copy
                      </>
                    )}
                  </Button>
                </CardFooter>
              )}
            </Card>
          ))}
        </div>
      </main>

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
                  onChange={(fields) => handleSchemaChange(cardBeingEdited.id, fields, setGeneratorCards)}
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
                onChange={(newSchema) => handleRawSchemaChange(cardBeingRawEdited.id, newSchema)}
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
    </div>
  )
}
