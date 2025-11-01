import { createTool } from "@mastra/core/tools";
import { z } from "zod";

export const echoTool = createTool({
  id: "echo",
  description: "Echo back the input message",
  inputSchema: z.object({
    message: z.string().describe("Message to echo back"),
  }),
  outputSchema: z.object({
    response: z.string(),
  }),
  execute: async ({ context }) => {
    return {
      response: `MASTRA Echo: ${context.message}`,
    };
  },
});
