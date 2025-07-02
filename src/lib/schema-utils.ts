import { generateId } from "ai";
import type { SchemaField, GeneratorCardType } from "@/types/dashboard";

export const generateSchemaStringRecursive = (
  fields: SchemaField[],
  indentLevel = 1,
): string => {
  const indent = "  ".repeat(indentLevel);
  const closingIndent = "  ".repeat(indentLevel - 1);

  const fieldStrings = fields
    .filter((field) => field.name.trim() !== "")
    .map((field) => {
      let typeString: string;
      switch (field.type) {
        case "array":
          if (field.arrayType === "object") {
            typeString = `z.array(${generateSchemaStringRecursive(field.arrayObjectFields ?? [], indentLevel + 1)})`;
          } else {
            typeString = `z.array(z.${field.arrayType ?? "string"}())`;
          }
          break;
        case "enum":
          const enumValues =
            field.enumValues
              ?.map((v) => `"${v.trim().replace(/"/g, '\\"')}"`)
              .join(", ") ?? "";
          if (!enumValues) {
            typeString = `z.enum(["PLACEHOLDER"])`;
          } else {
            typeString = `z.enum([${enumValues}])`;
          }
          break;
        case "object":
          typeString = generateSchemaStringRecursive(
            field.objectFields ?? [],
            indentLevel + 1,
          );
          break;
        default:
          typeString = `z.${field.type}()`;
      }

      if (field.description.trim() !== "") {
        typeString += `.describe("${field.description.trim().replace(/"/g, '\\"')}")`;
      }

      return `${indent}${field.name.trim()}: ${typeString}`;
    })
    .join(",\n");

  return `z.object({\n${fieldStrings}\n${closingIndent}})`;
};

export const generateSchemaString = (card: GeneratorCardType): string => {
  // Use raw schema if available, otherwise generate from fields
  if (card.rawSchema) {
    return card.rawSchema;
  }

  if (!card.schemaFields || card.schemaFields.length === 0) {
    return "z.object({})";
  }
  return generateSchemaStringRecursive(card.schemaFields);
};

export const validateZodSchema = (
  schemaString: string,
): { isValid: boolean; error?: string } => {
  try {
    // Basic syntax validation without executing the code
    if (!schemaString.trim().startsWith("z.")) {
      return { isValid: false, error: "Schema must start with 'z.'" };
    }

    // Check for disallowed .max() usage
    if (/\.max\s*\(/.test(schemaString)) {
      return {
        isValid: false,
        error: "Schema cannot contain .max() - this constraint is not allowed",
      };
    }

    // Check for balanced parentheses and braces
    let parenCount = 0;
    let braceCount = 0;
    let inString = false;
    let stringChar = "";

    for (let i = 0; i < schemaString.length; i++) {
      const char = schemaString[i];
      const prevChar = i > 0 ? schemaString[i - 1] : "";

      if (!inString && (char === '"' || char === "'" || char === "`")) {
        inString = true;
        stringChar = char;
      } else if (inString && char === stringChar && prevChar !== "\\") {
        inString = false;
        stringChar = "";
      } else if (!inString) {
        if (char === "(") parenCount++;
        else if (char === ")") parenCount--;
        else if (char === "{") braceCount++;
        else if (char === "}") braceCount--;
      }
    }

    if (parenCount !== 0) {
      return { isValid: false, error: "Unbalanced parentheses in schema" };
    }

    if (braceCount !== 0) {
      return { isValid: false, error: "Unbalanced braces in schema" };
    }

    // Check for common Zod patterns
    const hasValidZodPattern =
      /z\.(object|string|number|boolean|array|enum|union|literal|optional|nullable)/.test(
        schemaString,
      );
    if (!hasValidZodPattern) {
      return {
        isValid: false,
        error: "Schema doesn't contain valid Zod types",
      };
    }

    return { isValid: true };
  } catch (error) {
    return {
      isValid: false,
      error: `Invalid schema: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
};

export const canParseSchema = (rawSchema: string): boolean => {
  const parsed = parseSimpleSchema(rawSchema);
  console.log("Parsing schema:", rawSchema);
  console.log("Parsed result:", parsed);
  return parsed.length > 0;
};

export const parseSimpleSchema = (rawSchema: string): SchemaField[] => {
  try {
    // Clean up the schema string
    const cleanSchema = rawSchema.trim();

    // Match the main z.object({ ... }) structure
    const objectRegex = /z\.object\s*\(\s*\{\s*([\s\S]*?)\s*\}\s*\)/;
    const objectMatch = objectRegex.exec(cleanSchema);
    if (!objectMatch) {
      console.log("No object match found");
      return [];
    }

    const fieldsString = objectMatch[1];
    if (!fieldsString) {
      return [];
    }
    console.log("Fields string:", fieldsString);

    // Split by commas that are not inside nested structures
    const fields: SchemaField[] = [];
    let currentField = "";
    let depth = 0;
    let inString = false;
    let stringChar = "";

    for (let i = 0; i < fieldsString.length; i++) {
      const char = fieldsString[i];
      const prevChar = i > 0 ? fieldsString[i - 1] : "";

      if (!inString && (char === '"' || char === "'" || char === "`")) {
        inString = true;
        stringChar = char;
      } else if (inString && char === stringChar && prevChar !== "\\") {
        inString = false;
        stringChar = "";
      } else if (!inString) {
        if (char === "{" || char === "(" || char === "[") {
          depth++;
        } else if (char === "}" || char === ")" || char === "]") {
          depth--;
        } else if (char === "," && depth === 0) {
          // This is a field separator
          const field = parseField(currentField.trim());
          if (field) fields.push(field);
          currentField = "";
          continue;
        }
      }

      currentField += char;
    }

    // Don't forget the last field
    if (currentField.trim()) {
      const field = parseField(currentField.trim());
      if (field) fields.push(field);
    }

    console.log("Final parsed fields:", fields);
    return fields;
  } catch (error) {
    console.error("Schema parsing error:", error);
    return [];
  }
};

// Helper function to parse individual fields
const parseField = (fieldString: string): SchemaField | null => {
  try {
    console.log("Parsing field:", fieldString);

    // Match field name and type definition
    const fieldRegex = /^(\w+)\s*:\s*(.+)$/;
    const fieldMatch = fieldRegex.exec(fieldString);
    if (!fieldMatch) {
      console.log("No field match");
      return null;
    }

    const name = fieldMatch[1];
    const typeDefinition = fieldMatch[2];

    if (!name || !typeDefinition) {
      return null;
    }

    console.log("Field name:", name, "Type def:", typeDefinition);

    // Extract description if present
    const describeRegex = /\.describe\s*\(\s*['"`]([^'"`]*?)['"`]\s*\)/;
    const describeMatch = describeRegex.exec(typeDefinition);
    const description = describeMatch?.[1] ?? "";
    console.log("Description:", description);

    // Remove the describe part to analyze the core type
    const coreType = typeDefinition
      .replace(/\.describe\s*\([^)]*\)/, "")
      .trim();
    console.log("Core type:", coreType);

    // Parse different Zod types - fix the regex patterns
    const stringRegex = /^z\.string\s*\(\s*\)?$/;
    if (stringRegex.exec(coreType)) {
      return {
        id: generateId(),
        name,
        type: "string",
        description,
      };
    }

    const numberRegex = /^z\.number\s*\(\s*\)?$/;
    if (numberRegex.exec(coreType)) {
      return {
        id: generateId(),
        name,
        type: "number",
        description,
      };
    }

    const booleanRegex = /^z\.boolean\s*\(\s*\)?$/;
    if (booleanRegex.exec(coreType)) {
      return {
        id: generateId(),
        name,
        type: "boolean",
        description,
      };
    }

    const enumRegex = /^z\.enum\s*\(/;
    if (enumRegex.exec(coreType)) {
      // Parse enum values
      const enumValueRegex = /z\.enum\s*\(\s*\[\s*([^\]]*)\s*\]\s*\)/;
      const enumMatch = enumValueRegex.exec(coreType);
      const enumValues = enumMatch?.[1]
        ? enumMatch[1].split(",").map((v) => v.trim().replace(/['"`]/g, ""))
        : [];

      return {
        id: generateId(),
        name,
        type: "enum",
        description,
        enumValues,
      };
    }

    const arrayRegex = /^z\.array\s*\(/;
    if (arrayRegex.exec(coreType)) {
      // Parse array type
      const arrayMatchRegex = /z\.array\s*\(\s*(.+?)\s*\)/;
      const arrayMatch = arrayMatchRegex.exec(coreType);
      if (!arrayMatch) return null;

      const arrayItemType = arrayMatch[1]?.trim();
      if (!arrayItemType) return null;

      const arrayStringRegex = /^z\.string\s*\(\s*\)?$/;
      if (arrayStringRegex.exec(arrayItemType)) {
        return {
          id: generateId(),
          name,
          type: "array",
          arrayType: "string",
          description,
        };
      }

      const arrayNumberRegex = /^z\.number\s*\(\s*\)?$/;
      if (arrayNumberRegex.exec(arrayItemType)) {
        return {
          id: generateId(),
          name,
          type: "array",
          arrayType: "number",
          description,
        };
      }

      const arrayBooleanRegex = /^z\.boolean\s*\(\s*\)?$/;
      if (arrayBooleanRegex.exec(arrayItemType)) {
        return {
          id: generateId(),
          name,
          type: "array",
          arrayType: "boolean",
          description,
        };
      }

      const arrayObjectRegex = /^z\.object\s*\(/;
      if (arrayObjectRegex.exec(arrayItemType)) {
        // Parse nested object in array
        const nestedFields = parseSimpleSchema(arrayItemType);
        return {
          id: generateId(),
          name,
          type: "array",
          arrayType: "object",
          description,
          arrayObjectFields: nestedFields,
        };
      }
    }

    const objectRegex = /^z\.object\s*\(/;
    if (objectRegex.exec(coreType)) {
      // Parse nested object
      const nestedFields = parseSimpleSchema(coreType);
      return {
        id: generateId(),
        name,
        type: "object",
        description,
        objectFields: nestedFields,
      };
    }

    // Default to string if we can't parse the type
    console.log("Defaulting to string for:", coreType);
    return {
      id: generateId(),
      name,
      type: "string",
      description,
    };
  } catch (error) {
    console.error("Field parsing error:", error);
    return null;
  }
};
