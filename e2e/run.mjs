#!/usr/bin/env node
/**
 * perly-pay-mcp end to end, as a user gets it: `npm pack` this package,
 * install the tarball in a temporary folder beside the official MCP client
 * SDK (never in packages/mcp: see .gitignore), spawn its `perly-pay-mcp`
 * bin over stdio and drive it against a local Perly Pay in test mode:
 *
 *   create_product → create_price → create_payment_link → simulate_payment
 *   → list_payments shows the payment, list_events the invoice's events,
 *
 * plus the refusals (confirm, a live key) and the local tools — in both
 * protocol eras (the 2025 initialize handshake, and 2026-07-28 via `auto`).
 *
 *   npx next dev -p 3272          # in the repo, local stack up and seeded
 *   node packages/mcp/e2e/run.mjs # PERLY_PAY_API / PERLY_PAY_SECRET_KEY to override
 *
 * Needs the npm registry once (the client SDK and the server's dependency).
 */
import { spawnSync } from "node:child_process";
import { copyFileSync, mkdtempSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const PACKAGE = join(HERE, "..");
const CLIENT_SDK = "@modelcontextprotocol/client@2.3.1";

const apiUrl = process.env.PERLY_PAY_API ?? "http://localhost:3272";
// Kestrel AI's local test key (scripts/seed.ts, CLAUDE.md): local stack only.
const secretKey = process.env.PERLY_PAY_SECRET_KEY ?? "sk_test_kestrelLOCALdevONLYkey0000000000";

function step(name, command, args, cwd) {
  process.stdout.write(`\nmcp e2e: ${name}\n`);
  const result = spawnSync(command, args, { cwd, stdio: "inherit" });
  if (result.status !== 0) {
    console.error(`mcp e2e: ${name} failed`);
    process.exit(result.status ?? 1);
  }
}

const probe = await fetch(`${apiUrl}/api/v1/openapi.json`).catch(() => null);
if (!probe?.ok) {
  console.error(`mcp e2e: no Perly Pay at ${apiUrl}. Start it (npx next dev -p 3272) or set PERLY_PAY_API.`);
  process.exit(1);
}

const tmp = mkdtempSync(join(tmpdir(), "perly-pay-mcp-e2e-"));
try {
  step("pack", "npm", ["pack", "--silent", "--pack-destination", tmp], PACKAGE);
  const tarball = readdirSync(tmp).find((f) => f.endsWith(".tgz"));
  step("install the tarball and the client", "npm", ["install", "--silent", "--no-audit", "--no-fund", "--prefix", tmp, join(tmp, tarball), CLIENT_SDK], tmp);
  copyFileSync(join(HERE, "client.mjs"), join(tmp, "client.mjs"));
  const result = spawnSync("node", [join(tmp, "client.mjs")], {
    cwd: tmp,
    stdio: "inherit",
    env: { ...process.env, E2E_BIN: join(tmp, "node_modules", ".bin", "perly-pay-mcp"), E2E_API_URL: apiUrl, E2E_SECRET_KEY: secretKey },
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
  console.log("\nmcp e2e: passed");
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
