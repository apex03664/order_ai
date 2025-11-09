import 'dotenv/config';
import { z } from 'zod';
import { ChatOpenAI } from "langchain/chat_models/openai";
import { tool } from "langchain/tools";
import { AgentExecutor, createToolCallingAgent } from "langchain/agents";

// Validate environment
const OpenAIEnvSchema = z.object({
  OPENAI_API_KEY: z.string().min(1, "OPENAI_API_KEY is required"),
});

const envParse = OpenAIEnvSchema.safeParse(process.env);
if (!envParse.success) {
  console.error("Missing environment variables:\n", envParse.error.flatten().fieldErrors);
  process.exit(1);
}

// Define a simple calculator tool
const calculator = tool({
  name: "calculator",
  description:
    "Evaluate simple arithmetic expressions. Supports +, -, *, /, parentheses. Input should be a single expression like '2*(3+4)'.",
  func: async (expression) => {
    const cleaned = String(expression).replace(/[^0-9+\-*/(). ]/g, "");
    try {
      // eslint-disable-next-line no-new-func
      const result = Function(`"use strict"; return (${cleaned});`)();
      if (typeof result !== "number" || Number.isNaN(result)) {
        throw new Error("Expression did not evaluate to a number");
      }
      return String(result);
    } catch (err) {
      return `Calculation error: ${err.message}`;
    }
  },
});

// Create the chat model
const model = new ChatOpenAI({
  modelName: "gpt-4o-mini", // economical, supports tool calling
  temperature: 0.2,
});

// System prompt for the agent
const systemPrompt = `
You are a helpful AI agent. Use tools when useful. Be concise.
For math, prefer the calculator tool for accuracy. Explain results briefly.
`;

// Build a tool-calling agent
const agent = await createToolCallingAgent({
  llm: model,
  tools: [calculator],
  prompt: systemPrompt,
});

const executor = new AgentExecutor({ agent, tools: [calculator] });

// Entry point: read user input from CLI args or default demo
const userInput = process.argv.slice(2).join(" ") ||
  "What is (123.45 * 6 - 7) / 3?";

console.log("\nUser:", userInput);
const result = await executor.invoke({ input: userInput });
console.log("\nAssistant:\n", result.output);


