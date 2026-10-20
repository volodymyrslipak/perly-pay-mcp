/**
 * The toolbox over MCP's stdio transport, with the official TypeScript SDK
 * (`@modelcontextprotocol/server`, pinned in package.json). `serveStdio`
 * answers both protocol eras: the 2025 `initialize` handshake today's
 * clients send, and the 2026-07-28 opening.
 *
 * The SDK is this package's one dependency. It is loaded by name at run
 * time, typed by the slice used here, so the Perly Pay repo's own type check
 * (which reads this file) does not need it installed; e2e/run.mjs drives
 * the real thing through the official client.
 */
import type { Tool, Toolbox, ToolResult } from "./toolbox.js";

interface McpServerInstance {
  registerTool(
    name: string,
    config: { title: string; description: string; inputSchema: unknown; annotations: Tool["annotations"] },
    callback: (args: Record<string, unknown>) => Promise<ToolResult>,
  ): unknown;
}

interface ServerModule {
  McpServer: new (
    info: { name: string; version: string; title?: string; websiteUrl?: string },
    options: { capabilities: { tools: Record<string, never> }; instructions: string },
  ) => McpServerInstance;
  fromJsonSchema(schema: Record<string, unknown>): unknown;
}

interface StdioModule {
  serveStdio(factory: () => McpServerInstance, options?: { onerror?: (error: Error) => void }): { close(): Promise<void> };
}

const SDK = "@modelcontextprotocol/server";

export async function serve(toolbox: Toolbox, info: { name: string; version: string; siteUrl: string }): Promise<{ close(): Promise<void> }> {
  const { McpServer, fromJsonSchema } = (await import(SDK)) as ServerModule;
  const { serveStdio } = (await import(`${SDK}/stdio`)) as StdioModule;
  return serveStdio(
    () => {
      const server = new McpServer(
        { name: info.name, version: info.version, title: "Perly Pay", websiteUrl: info.siteUrl },
        { capabilities: { tools: {} }, instructions: toolbox.instructions },
      );
      for (const tool of toolbox.tools) {
        server.registerTool(
          tool.name,
          { title: tool.title, description: tool.description, inputSchema: fromJsonSchema(tool.inputSchema), annotations: tool.annotations },
          (args) => toolbox.call(tool.name, args),
        );
      }
      return server;
    },
    // stdout is the protocol; anything else goes to stderr, which clients show as the server's log.
    { onerror: (error) => process.stderr.write(`perly-pay-mcp: ${error.message}\n`) },
  );
}
