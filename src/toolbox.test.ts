/**
 * Every tool, called the way an assistant calls it, against a fetch
 * stand-in: what it sends (method, path, query, body, headers), what it
 * refuses before sending, and what it answers. No network, no MCP SDK.
 */
import { describe, expect, it } from "vitest";
import { readConfig, redact } from "./config";
import { CURATION, type Exposed } from "./curation";
import type { Json } from "./generate";
import { OPERATIONS } from "./operations.generated";
import { createToolbox, type ToolResult } from "./toolbox";
import { computeSignature } from "./webhooks";

const TEST_KEY = `sk_test_${"a1".repeat(16)}`;
const LIVE_KEY = `sk_live_${"b2".repeat(16)}`;

interface Sent {
  method: string;
  url: URL;
  headers: Record<string, string>;
  body: unknown;
}

/** A fetch that records each request and answers from `reply` (default: 200 with `{ id: "obj_1" }`). */
function fakeFetch(reply: (sent: Sent, n: number) => Response = () => Response.json({ id: "obj_1", object: "thing" })) {
  const sent: Sent[] = [];
  const fetch = (async (input: string | URL | Request, init?: RequestInit) => {
    const s: Sent = {
      method: init?.method ?? "GET",
      url: new URL(String(input)),
      headers: (init?.headers ?? {}) as Record<string, string>,
      body: init?.body ? JSON.parse(String(init.body)) : undefined,
    };
    sent.push(s);
    return reply(s, sent.length);
  }) as typeof globalThis.fetch;
  return { fetch, sent };
}

function box(key: string | undefined, fetch: typeof globalThis.fetch, env: Record<string, string> = {}) {
  const config = readConfig({ PERLY_PAY_SECRET_KEY: key, PERLY_PAY_API: "http://localhost:3272", ...env });
  return createToolbox(config, { fetch, sleep: async () => {}, uuid: () => "idem-1", now: () => 1_800_000_000 });
}

const textOf = (r: ToolResult) => r.content.map((c) => c.text).join("\n");

/** The smallest value a JSON schema takes. */
function sample(schema: Json): unknown {
  if ("const" in schema) return schema.const;
  if (Array.isArray(schema.enum)) return schema.enum[0];
  if (Array.isArray(schema.anyOf)) return sample(schema.anyOf[0] as Json);
  if (Array.isArray(schema.oneOf)) return sample(schema.oneOf[0] as Json);
  const type = Array.isArray(schema.type) ? schema.type[0] : schema.type;
  switch (type) {
    case "integer":
    case "number":
      return (schema.minimum as number | undefined) ?? 1;
    case "boolean":
      return true;
    case "array":
      return [sample((schema.items ?? {}) as Json)];
    case "object": {
      const props = (schema.properties ?? {}) as Record<string, Json>;
      return Object.fromEntries(((schema.required ?? []) as string[]).map((k) => [k, sample(props[k] ?? {})]));
    }
    default:
      return "x";
  }
}

/** Every required field and every optional query field, so each lands where it belongs. */
function argsFor(schema: Json, queryParams: string[]): Record<string, unknown> {
  const props = (schema.properties ?? {}) as Record<string, Json>;
  const names = new Set([...((schema.required ?? []) as string[]), ...queryParams]);
  return Object.fromEntries([...names].map((k) => [k, k === "confirm" ? true : sample(props[k] ?? {})]));
}

describe("the tool set", () => {
  const { tools } = box(TEST_KEY, fakeFetch().fetch);

  it("is every exposed operation plus the two local tools, under clients' limits", () => {
    const names = tools.map((t) => t.name);
    expect(names).toEqual([...OPERATIONS.map((o) => o.tool), "verify_webhook_signature", "pay_links"]);
    expect(names.length).toBeLessThanOrEqual(40);
  });

  it("every input schema is a plain object at the top (no oneOf there: some clients refuse it)", () => {
    for (const tool of tools) {
      expect(tool.inputSchema.type, tool.name).toBe("object");
      for (const key of ["oneOf", "anyOf", "allOf"]) expect(tool.inputSchema, tool.name).not.toHaveProperty(key);
      expect(tool.description.length, tool.name).toBeGreaterThan(10);
    }
  });

  it("tools that cannot be undone ask for confirm and say they are destructive", () => {
    for (const tool of tools) {
      const op = OPERATIONS.find((o) => o.tool === tool.name);
      const decision = op && (CURATION[op.operationId] as Exposed);
      if (decision?.confirm) {
        expect(tool.inputSchema.required, tool.name).toContain("confirm");
        expect(tool.annotations.destructiveHint, tool.name).toBe(true);
      } else {
        expect(tool.annotations.destructiveHint, tool.name).toBe(false);
      }
      if (op) expect(tool.annotations.readOnlyHint, tool.name).toBe(op.method === "GET");
    }
  });
});

describe.each(OPERATIONS.map((op) => [op.tool, op] as const))("%s", (_name, op) => {
  const decision = CURATION[op.operationId] as Exposed;
  const args = argsFor(
    box(TEST_KEY, fakeFetch().fetch).tools.find((t) => t.name === op.tool)!.inputSchema,
    op.queryParams,
  );
  if (op.tool === "simulate_payment") args.id = "inv_1";

  it("sends its arguments where the API reads them", async () => {
    const { fetch, sent } = fakeFetch();
    const result = await box(TEST_KEY, fetch).call(op.tool, args);
    expect(result.isError, textOf(result)).toBeUndefined();
    expect(sent).toHaveLength(1);
    const [req] = sent;
    expect(req!.method).toBe(op.method);
    const path = op.pathParams.reduce((p, name) => p.replace(`{${name}}`, String(args[name])), op.path);
    expect(req!.url.pathname).toBe(`/api/v1${path}`);
    for (const q of op.queryParams) if (args[q] !== undefined) expect(req!.url.searchParams.get(q)).toBe(String(args[q]));
    expect(req!.headers.Authorization).toBe(`Bearer ${TEST_KEY}`);
    if (op.method === "POST") {
      expect(req!.headers["Idempotency-Key"]).toBe("idem-1");
      const body = req!.body as Record<string, unknown>;
      expect(Object.keys(body).sort()).toEqual(op.bodyParams.filter((b) => args[b] !== undefined).sort());
      expect(body).not.toHaveProperty("confirm");
    } else {
      expect(req!.body).toBeUndefined();
    }
    expect(JSON.parse(textOf(result))).toEqual({ id: "obj_1", object: "thing" });
  });

  if (decision.live === "refuse") {
    it("is refused with a live key, with why, and sends nothing", async () => {
      const { fetch, sent } = fakeFetch();
      const result = await box(LIVE_KEY, fetch).call(op.tool, args);
      expect(result.isError).toBe(true);
      expect(textOf(result)).toContain("Refused with a live key");
      expect(textOf(result)).toContain(decision.liveWhy!);
      expect(sent).toHaveLength(0);
    });
  } else {
    it("works with a live key too", async () => {
      const { fetch, sent } = fakeFetch();
      const result = await box(LIVE_KEY, fetch).call(op.tool, args);
      expect(result.isError).toBeUndefined();
      expect(sent).toHaveLength(1);
    });
  }

  if (decision.confirm) {
    it("does nothing without confirm: true", async () => {
      const { fetch, sent } = fakeFetch();
      for (const confirm of [undefined, false, "true"]) {
        const result = await box(TEST_KEY, fetch).call(op.tool, { ...args, confirm });
        expect(result.isError).toBe(true);
        expect(textOf(result)).toContain("confirm: true");
      }
      expect(sent).toHaveLength(0);
    });
  }
});

describe("keys and errors", () => {
  it("without a key, an API tool says how to set one and sends nothing", async () => {
    const { fetch, sent } = fakeFetch();
    const result = await box(undefined, fetch).call("list_products", {});
    expect(result.isError).toBe(true);
    expect(textOf(result)).toContain("PERLY_PAY_SECRET_KEY");
    expect(sent).toHaveLength(0);
  });

  it("a webhook secret in the key's place is named for what it is", async () => {
    const result = await box("whsec_abc", fakeFetch().fetch).call("list_products", {});
    expect(textOf(result)).toContain("webhook signing secret");
  });

  it("never sends the key over plain http to another machine", async () => {
    const { fetch, sent } = fakeFetch();
    const result = await box(TEST_KEY, fetch, { PERLY_PAY_API: "http://pay.example.com" }).call("list_products", {});
    expect(result.isError).toBe(true);
    expect(textOf(result)).toContain("https");
    expect(sent).toHaveLength(0);
  });

  it("never repeats the key, even when the API echoes it", async () => {
    const { fetch } = fakeFetch(() => Response.json({ error: { type: "authentication_error", code: "api_key_invalid", message: `Unknown key ${TEST_KEY}` } }, { status: 401 }));
    const result = await box(TEST_KEY, fetch).call("list_products", {});
    expect(textOf(result)).not.toContain(TEST_KEY);
    expect(textOf(result)).toContain("sk_…[hidden]");
    expect(textOf(result)).toContain("/dashboard/developers");
  });

  it("maps an API error to its code, field and what to do", async () => {
    const { fetch } = fakeFetch(() =>
      Response.json({ error: { type: "permission_error", code: "live_mode_disabled", message: "Live mode is not on for this account yet." } }, { status: 403, headers: { "Perly-Request-Id": "req_9" } }),
    );
    const text = textOf(await box(LIVE_KEY, fetch).call("list_products", {}));
    expect(text).toContain("Perly Pay refused (live_mode_disabled)");
    expect(text).toContain("http://localhost:3272/dashboard/wallets");
    expect(text).toContain("req_9");
    const { fetch: f2 } = fakeFetch(() => Response.json({ error: { type: "invalid_request_error", code: "parameter_invalid", message: "Too long.", param: "name" } }, { status: 400 }));
    expect(textOf(await box(TEST_KEY, f2).call("create_product", { name: "x" }))).toContain("Field: name");
  });

  it("retries a 5xx with the same idempotency key, then answers", async () => {
    const { fetch, sent } = fakeFetch((_s, n) => (n < 3 ? new Response("{}", { status: 503 }) : Response.json({ id: "prod_1" })));
    const result = await box(TEST_KEY, fetch).call("create_product", { name: "Hour" });
    expect(result.isError).toBeUndefined();
    expect(sent).toHaveLength(3);
    expect(new Set(sent.map((s) => s.headers["Idempotency-Key"]))).toEqual(new Set(["idem-1"]));
  });

  it("says when Perly Pay cannot be reached", async () => {
    const fetch = (async () => {
      throw new TypeError("fetch failed");
    }) as typeof globalThis.fetch;
    const text = textOf(await box(TEST_KEY, fetch).call("list_products", {}));
    expect(text).toContain("Could not reach Perly Pay");
    expect(text).toContain("PERLY_PAY_API");
  });

  it("redact hides anything shaped like a key", () => {
    expect(redact(`a ${LIVE_KEY} b`, null)).toBe("a sk_live_…[hidden] b");
  });
});

describe("simulate_payment from a payment link", () => {
  it("buys the link's price as a test invoice, then pays it", async () => {
    const { fetch, sent } = fakeFetch((s) => {
      if (s.url.pathname.endsWith("/payment_links/plink_1")) return Response.json({ id: "plink_1", price: "price_1", quantity: 2, url: "http://localhost:3272/l/abc" });
      if (s.url.pathname.endsWith("/invoices")) return Response.json({ id: "inv_7" });
      return Response.json({ id: "inv_7", status: "paid" });
    });
    const result = await box(TEST_KEY, fetch).call("simulate_payment", { payment_link: "plink_1" });
    expect(result.isError).toBeUndefined();
    expect(sent.map((s) => `${s.method} ${s.url.pathname}`)).toEqual([
      "GET /api/v1/payment_links/plink_1",
      "POST /api/v1/invoices",
      "POST /api/v1/invoices/inv_7/simulate",
    ]);
    expect(sent[1]!.body).toEqual({ line_items: [{ price: "price_1", quantity: 2 }], metadata: { simulated_from_payment_link: "plink_1" } });
    expect(sent[2]!.body).toEqual({});
    expect(JSON.parse(textOf(result)).invoice).toEqual({ id: "inv_7", status: "paid" });
  });

  it("asks for an invoice or a link when given neither", async () => {
    const { fetch, sent } = fakeFetch();
    const result = await box(TEST_KEY, fetch).call("simulate_payment", {});
    expect(result.isError).toBe(true);
    expect(sent).toHaveLength(0);
  });
});

describe("verify_webhook_signature", () => {
  const secret = "whsec_test_secret_123";
  const body = JSON.stringify({ id: "evt_1", type: "invoice.paid", livemode: false });
  const t = 1_800_000_000;

  it("accepts a good signature and names the event, without the secret", async () => {
    const result = await box(undefined, fakeFetch().fetch).call("verify_webhook_signature", {
      payload: body,
      signature: `t=${t},v1=${computeSignature(secret, t, body)}`,
      secret,
    });
    expect(result.isError).toBeUndefined();
    expect(JSON.parse(textOf(result))).toEqual({ valid: true, event: { id: "evt_1", type: "invoice.paid", livemode: false } });
    expect(textOf(result)).not.toContain(secret);
  });

  it("uses PERLY_PAY_WEBHOOK_SECRET when no secret is passed, and says why a bad one fails", async () => {
    const tools = box(undefined, fakeFetch().fetch, { PERLY_PAY_WEBHOOK_SECRET: secret });
    const good = await tools.call("verify_webhook_signature", { payload: body, signature: `Perly-Signature: t=${t},v1=${computeSignature(secret, t, body)}` });
    expect(good.isError).toBeUndefined();
    const changed = await tools.call("verify_webhook_signature", { payload: `${body} `, signature: `t=${t},v1=${computeSignature(secret, t, body)}` });
    expect(changed.isError).toBe(true);
    expect(JSON.parse(textOf(changed)).code).toBe("signature_mismatch");
    const old = await tools.call("verify_webhook_signature", { payload: body, signature: `t=${t - 301},v1=${computeSignature(secret, t - 301, body)}` });
    expect(JSON.parse(textOf(old)).code).toBe("timestamp_out_of_tolerance");
  });
});

describe("pay_links", () => {
  it("gives the dashboard pages a person must use, with the mode, without a key", async () => {
    const all = JSON.parse(textOf(await box(undefined, fakeFetch().fetch).call("pay_links", {})));
    expect(all.mode).toBeNull();
    expect(all.links.map((l: { topic: string }) => l.topic)).toEqual(expect.arrayContaining(["choose_plan", "connect_wallet", "go_live", "two_factor"]));
    const one = JSON.parse(textOf(await box(LIVE_KEY, fakeFetch().fetch).call("pay_links", { topic: "two_factor" })));
    expect(one).toEqual({ mode: "live", links: [{ topic: "two_factor", url: "http://localhost:3272/dashboard/settings/security", what: expect.any(String) }] });
  });
});

describe("the server's instructions", () => {
  it("say the mode and the way to sell, and point at pay_links", () => {
    const { instructions } = box(LIVE_KEY, fakeFetch().fetch);
    expect(instructions).toContain("LIVE mode");
    expect(instructions).toContain("create_payment_link");
    expect(instructions).toContain("pay_links");
  });
});
