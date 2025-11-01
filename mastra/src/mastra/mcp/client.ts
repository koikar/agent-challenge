import { MCPClient } from "@mastra/mcp";

export const mcpClient = new MCPClient({
  id: "ai-search",
  servers: {
    tedix: {
      url: new URL(process.env.MCP_URL!),
      requestInit: {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json, text/event-stream",
        },
      },
      timeout: 30000,
    },
  },
});
