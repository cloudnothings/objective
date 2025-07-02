"use server";

import { generateObject, generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";

// A list of allowed models to prevent arbitrary model usage.
const ALLOWED_MODELS = [
  "gpt-4o",
  "gpt-4-turbo",
  "o1",
  "o3-mini",
  "gpt-4.5-preview",
] as const;

export async function generateAiObject(
  data: string,
  model: string,
  systemMessage: string,
  outputSchemaString: string,
): Promise<unknown> {
  if (!ALLOWED_MODELS.includes(model as (typeof ALLOWED_MODELS)[number])) {
    throw new Error(`Model '${model}' is not allowed.`);
  }

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
    const response = await generateObject({
      model: openai(model),
      schema: schema,
      system: systemMessage,
      prompt: data,
    });

    if (!response.object) {
      throw new Error("The AI did not return a valid object.");
    }

    return response.object;
  } catch (error) {
    console.error("AI generation error:", error);
    // Pass a more user-friendly error message to the client
    throw new Error(
      `AI generation failed: ${error instanceof Error ? error.message : "An unknown error occurred"}`,
    );
  }
}

export async function generateSystemMessage(prompt: string): Promise<string> {
  try {
    const { text } = await generateText({
      model: openai("gpt-4o"),
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

export async function generateZodSchema(prompt: string): Promise<string> {
  try {
    const { text } = await generateText({
      model: openai("gpt-4o"),
      system: `You are an expert at creating Zod schemas. Generate valid Zod schema code that matches the user's requirements. 

CRITICAL RULES:
- Always return ONLY the Zod schema code, nothing else
- Start with z.object({ and end with })
- Use proper Zod syntax: z.string(), z.number(), z.boolean(), z.array(), z.enum(), z.object()
- Add .describe() to fields when helpful
- Use camelCase for field names
- Do NOT include any explanations, markdown, or extra text
- Do NOT wrap in code blocks or backticks

VALID EXAMPLE:
z.object({
  name: z.string().describe("Full name"),
  age: z.number().describe("Age in years"),
  tags: z.array(z.string()).describe("List of tags")
})`,
      prompt: `Create a Zod schema for: ${prompt}

Return ONLY the schema code, no explanations.`,
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
): Promise<{ systemMessage: string; schema: string }> {
  try {
    const { object } = await generateObject({
      model: openai("gpt-4o"),
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
- Make it comprehensive but not overly complex`,
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
