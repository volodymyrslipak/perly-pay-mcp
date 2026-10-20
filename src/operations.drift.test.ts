/**
 * The MCP server cannot drift from Perly Pay's API. The document here is
 * the one /api/v1/openapi.json serves, built from the zod schemas the API
 * validates requests with:
 *
 *   - every operation in it is decided on in src/curation.ts (exposed, or
 *     left out with a reason), and the table names nothing the API lacks;
 *   - operations.generated.ts is exactly what generate.ts makes of it.
 *
 * A new or changed endpoint fails here until the table decides on it and
 * the file is regenerated:
 *
 *   npx vitest run packages/mcp/src/operations.drift.test.ts -u
 */
import { describe, expect, it } from "vitest";
import { openApiDocument } from "@/services/api/openapi";
import { ENDPOINTS } from "@/services/api/registry";
import { MCP_TOOL_ROWS } from "@/services/site/docs/en/mcp";
import { contractProblems } from "../../../plugins/contract";
import { CURATION } from "./curation";
import { buildOperations, operationsOf, renderOperations, type Json } from "./generate";
import { OPERATIONS } from "./operations.generated";
import { readConfig } from "./config";
import { createToolbox } from "./toolbox";

const doc = openApiDocument("https://pay.perly.io") as Json;

describe("the MCP tools and the API", () => {
  it("every API operation is decided on, and nothing else", () => {
    const ids = operationsOf(doc).map((o) => o.operationId);
    const undecided = ids.filter((id) => !(id in CURATION));
    const gone = Object.keys(CURATION).filter((id) => !ids.includes(id));
    expect(undecided, "new API operations: decide on them in packages/mcp/src/curation.ts").toEqual([]);
    expect(gone, "operations the API no longer has: drop them from packages/mcp/src/curation.ts").toEqual([]);
  });

  it("operations.generated.ts is what the API's document makes", async () => {
    await expect(renderOperations(buildOperations(doc))).toMatchFileSnapshot("./operations.generated.ts");
  });

  it("every tool calls a secret-key endpoint the API serves, test-only where the API says so", () => {
    for (const op of OPERATIONS) {
      const endpoint = ENDPOINTS.find((e) => e.operationId === op.operationId);
      expect(endpoint, op.operationId).toBeDefined();
      expect(endpoint!.auth, op.operationId).toBe("secret");
      expect(op.testOnly, op.operationId).toBe(endpoint!.testOnly);
      // A test-only endpoint is refused by the server with a live key; the tool refuses first and says why.
      if (op.testOnly) expect(CURATION[op.operationId], op.operationId).toMatchObject({ live: "refuse" });
    }
  });

  it("tool names are unique and fit every client's limit", () => {
    const names = OPERATIONS.map((o) => o.tool);
    expect(new Set(names).size).toBe(names.length);
    for (const name of names) expect(name).toMatch(/^[a-z][a-z0-9_]{0,63}$/);
  });

  it("a tool's arguments, split the way the server splits them, pass the API's own schemas", () => {
    // One representative call per tool family; the rest share their shape.
    const id = (prefix: string) => `${prefix}_${"0f".repeat(16)}`;
    const sent = [
      { method: "POST", path: "/products", body: { name: "Consulting hour" } },
      { method: "POST", path: "/prices", body: { product: id("prod"), model: "one_time", unit_amount: 5000 } },
      { method: "POST", path: "/payment_links", body: { price: id("price") } },
      { method: "GET", path: "/payments", query: { limit: "5", invoice: id("inv") } },
      { method: "POST", path: `/invoices/${id("inv")}/simulate`, body: { outcome: "full" } },
      { method: "GET", path: "/entitlements/check", query: { customer: id("cus"), product: id("prod") } },
    ];
    for (const request of sent) {
      // The tool refuses a test-only call with a live key before sending it, so that complaint does not apply here.
      const problems = contractProblems(request).filter((p) => !p.includes("test mode only"));
      expect(problems, `${request.method} ${request.path}`).toEqual([]);
    }
  });

  it("the docs page (/docs/mcp, both languages) lists every tool, and no other", () => {
    const tools = createToolbox(readConfig({}), { fetch: globalThis.fetch }).tools.map((t) => t.name);
    const listed = MCP_TOOL_ROWS.flatMap(([names]) => names.split(", "));
    expect(listed.sort()).toEqual([...tools].sort());
  });
});
