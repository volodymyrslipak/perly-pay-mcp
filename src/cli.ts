#!/usr/bin/env node
/**
 * `npx perly-pay-mcp`: Perly Pay's MCP server on stdio, for an AI coding
 * assistant on this machine. It talks only to Perly Pay's public API with
 * the key it is given; no server of ours sits in between.
 *
 *   PERLY_PAY_SECRET_KEY=sk_test_… npx -y perly-pay-mcp
 */
import { readConfig } from "./config.js";
import { serve } from "./server.js";
import { createToolbox, MCP_VERSION, SERVER_NAME } from "./toolbox.js";

const args = process.argv.slice(2);
if (args.includes("--version") || args.includes("-v")) {
  process.stdout.write(`${MCP_VERSION}\n`);
  process.exit(0);
}
if (args.includes("--help") || args.includes("-h")) {
  process.stdout.write(
    [
      "perly-pay-mcp: Perly Pay's MCP server on stdio.",
      "",
      "  PERLY_PAY_SECRET_KEY      sk_test_… (or sk_live_…: then nothing that moves money or deletes)",
      "  PERLY_PAY_API         default https://pay.perly.io",
      "  PERLY_PAY_WEBHOOK_SECRET  optional whsec_…, for verify_webhook_signature",
      "",
      "  claude mcp add perly-pay --env PERLY_PAY_SECRET_KEY=sk_test_… -- npx -y perly-pay-mcp",
      "",
      "Docs: https://pay.perly.io/docs/mcp",
      "",
    ].join("\n"),
  );
  process.exit(0);
}

const config = readConfig(process.env);
const toolbox = createToolbox(config, { fetch: globalThis.fetch });
await serve(toolbox, { name: SERVER_NAME, version: MCP_VERSION, siteUrl: config.siteUrl });
// The log never names the key, only its mode.
process.stderr.write(
  `perly-pay-mcp ${MCP_VERSION}: ${config.mode ? `${config.mode} mode` : (config.keyProblem ?? "no key")} · ${config.siteUrl}${config.urlProblem ? ` · ${config.urlProblem}` : ""}\n`,
);
