"use server";

import { generateObject, generateText } from "ai";
import { openai, createOpenAI } from "@ai-sdk/openai";
import { z } from "zod";

export interface GenerateResult {
  object: unknown;
  tokenUsage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export async function generateAiObject(
  data: string,
  model: string,
  systemMessage: string,
  outputSchemaString: string,
  apiKey?: string,
): Promise<GenerateResult> {
  let schema: z.ZodTypeAny;

  try {
    // WARNING: This uses `new Function` to dynamically create a Zod schema from a string.
    // This is a potential security risk if the input string is not trusted.
    // In a real-world application, you would want to use a safer method for schema definition,
    // such as a JSON schema builder UI or a more robust parsing and validation layer.
    // For this tool's purpose of experimentation, we proceed with this method,
    // but it's crucial to be aware of the implications.
    // eslint-disable-next-line @typescript-eslint/no-implied-eval
    const schemaFunction = new Function("z", `return ${outputSchemaString}`);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
    schema = schemaFunction(z);

    // Basic validation to ensure it's a Zod schema
    if (typeof schema.parse !== "function") {
      throw new Error(
        "Invalid Zod schema provided. The string must return a Zod object.",
      );
    }
  } catch (error) {
    console.error("Schema parsing error:", error);
    throw new Error(
      `Failed to parse Zod schema: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }

  try {
    const provider = apiKey ? createOpenAI({ apiKey }) : openai;
    const response = await generateObject({
      model: provider(model),
      schema: schema,
      system: systemMessage,
      prompt: data,
    });

    if (!response.object) {
      throw new Error("The AI did not return a valid object.");
    }

    return {
      object: response.object,
      tokenUsage: response.usage
        ? {
            promptTokens: response.usage.promptTokens,
            completionTokens: response.usage.completionTokens,
            totalTokens: response.usage.totalTokens,
          }
        : undefined,
    };
  } catch (error) {
    console.error("AI generation error:", error);

    // Enhanced error handling for schema validation errors
    let detailedError = null;

    // Check for validation errors in the error structure
    const findValidationErrors = (
      err: unknown,
    ): { issues: unknown[]; value: unknown } | null => {
      if (!err || typeof err !== "object") return null;

      const errorObj = err as Record<string, unknown>;

      // Check if this error has issues directly
      if ("issues" in errorObj && Array.isArray(errorObj.issues)) {
        return {
          issues: errorObj.issues,
          value: "value" in errorObj ? errorObj.value : null,
        };
      }

      // Check the cause chain
      if ("cause" in errorObj && errorObj.cause) {
        return findValidationErrors(errorObj.cause);
      }

      return null;
    };

    detailedError = findValidationErrors(error);

    if (detailedError && detailedError.issues.length > 0) {
      const issueDescriptions = detailedError.issues
        .map((issue: unknown) => {
          if (issue && typeof issue === "object" && issue !== null) {
            const issueObj = issue as Record<string, unknown>;
            const path = Array.isArray(issueObj.path)
              ? issueObj.path.join(".")
              : "root";
            const message =
              typeof issueObj.message === "string"
                ? issueObj.message
                : "Validation error";
            return `Field "${path}": ${message}`;
          }
          return "Unknown validation error";
        })
        .join("; ");

      const generatedValue = detailedError.value
        ? JSON.stringify(detailedError.value, null, 2)
        : "Unknown";

      throw new Error(
        `Schema validation failed: ${issueDescriptions}. Generated value: ${generatedValue}`,
      );
    }

    // Pass a more user-friendly error message to the client
    throw new Error(
      `AI generation failed: ${error instanceof Error ? error.message : "An unknown error occurred"}`,
    );
  }
}

export async function generateSystemMessage(
  prompt: string,
  apiKey?: string,
): Promise<string> {
  try {
    const client = apiKey ? openai({ apiKey }) : openai("gpt-4o");
    const { text } = await generateText({
      model: apiKey ? client("gpt-4o") : openai("gpt-4o"),
      system: `You are an expert at writing system messages for AI assistants. Create concise, effective system messages that clearly define the AI's role and behavior. Focus on being specific about the task, output format, and any constraints. Keep it under 200 words.`,
      prompt: `Create a system message for an AI that should: ${prompt}`,
    });

    return text;
  } catch (error) {
    console.error("System message generation error:", error);
    throw new Error(
      `Failed to generate system message: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

export async function generateZodSchema(
  prompt: string,
  apiKey?: string,
): Promise<string> {
  try {
    const client = apiKey ? openai({ apiKey }) : openai("gpt-4o");
    const { text } = await generateText({
      model: apiKey ? client("gpt-4o") : openai("gpt-4o"),
      system: `You are an expert at creating Zod schemas. Generate valid Zod schema code that matches the user's requirements. 

CRITICAL RULES:
- Always return ONLY the Zod schema code, nothing else
- Start with z.object({ and end with })
- Use proper Zod syntax: z.string(), z.number(), z.boolean(), z.array(), z.enum(), z.object()
- Add .describe() to fields when helpful
- Use camelCase for field names
- Do NOT include any explanations, markdown, or extra text
- Do NOT wrap in code blocks or backticks
- NEVER use .max() constraints - they are forbidden
- Do NOT use .min(), .length(), or other size constraints
- Focus on data types and structure, not size limits

VALID EXAMPLE:
z.object({
  name: z.string().describe("Full name"),
  age: z.number().describe("Age in years"),
  tags: z.array(z.string()).describe("List of tags")
})`,
      prompt: `Create a Zod schema for: ${prompt}

Return ONLY the schema code, no explanations. Do not include any .max() or size constraints.`,
    });

    // Clean up the response to ensure it's just the schema
    let cleanedSchema = text.trim();

    // Remove any markdown code blocks
    cleanedSchema = cleanedSchema
      .replace(/```[a-zA-Z]*\n?/g, "")
      .replace(/```/g, "");

    // Remove any leading/trailing whitespace
    cleanedSchema = cleanedSchema.trim();

    // Ensure it starts with z.object
    if (!cleanedSchema.startsWith("z.object")) {
      throw new Error("Generated schema does not start with z.object");
    }

    return cleanedSchema;
  } catch (error) {
    console.error("Schema generation error:", error);
    throw new Error(
      `Failed to generate schema: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

export async function generateSystemAndSchema(
  prompt: string,
  apiKey?: string,
): Promise<{ systemMessage: string; schema: string }> {
  try {
    const provider = apiKey ? createOpenAI({ apiKey }) : openai;
    const { object } = await generateObject({
      model: provider("gpt-4o"),
      system: `You are an expert at creating AI data extraction configurations. Given a user's description, generate both a system message and Zod schema.

SYSTEM MESSAGE RULES:
- Be concise but specific (under 200 words)
- Clearly define the AI's role and task
- Mention output format and constraints
- Be professional and focused

SCHEMA RULES:
- Return valid Zod schema code starting with z.object({})
- Use appropriate types: z.string(), z.number(), z.boolean(), z.array(), z.enum(), z.object()
- Add .describe() for clarity
- Use camelCase field names
- Make it comprehensive but not overly complex
- NEVER use .max() constraints - they are forbidden
- Do NOT use .min(), .length(), or other size constraints
- Focus on data types and structure, not size limits`,
      schema: z.object({
        systemMessage: z
          .string()
          .describe("The system message for the AI assistant"),
        schema: z
          .string()
          .describe("The Zod schema code starting with z.object"),
      }),
      prompt: `Create a complete AI configuration for: ${prompt}

Generate both a system message and Zod schema that work together.`,
    });

    // Validate the generated schema
    const cleanedSchema = object.schema.trim();
    if (!cleanedSchema.startsWith("z.object")) {
      throw new Error("Generated schema does not start with z.object");
    }

    return {
      systemMessage: object.systemMessage,
      schema: cleanedSchema,
    };
  } catch (error) {
    console.error("System and schema generation error:", error);
    throw new Error(
      `Failed to generate configuration: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}
