import { Agent } from "@mastra/core/agent";
import { createOllama } from "ollama-ai-provider-v2";

import { mcpClient } from "../mcp/client";

const ollama = createOllama({
  baseURL: process.env.NOS_OLLAMA_API_URL || process.env.OLLAMA_API_URL,
});

export const brandAgent = new Agent({
  name: "Brand Assistant",
  description: "A brand agent with echo capabilities an AI Search",

  model: ollama(
    process.env.NOS_MODEL_NAME_AT_ENDPOINT ||
      process.env.MODEL_NAME_AT_ENDPOINT ||
      "qwen3:8b",
  ),

  tools: await mcpClient.getTools(),

  instructions: `You are a helpful brand assistant with access to brand content search.

Available tools:
AI Search tools - Use to search brand content and provide helpful information

When users ask about brands, products, or company information, use the AI Search tools first.

For testing the system, use the echo tool.

Keep responses friendly and helpful.`,
});
