/**
 * The assistant's side of e2e/run.mjs, copied beside the installed packages
 * and run there: the official MCP client spawns the installed bin over stdio
 * and calls its tools the way Claude Code, Cursor or Codex would.
 */
import assert from "node:assert/strict";
import { Client } from "@modelcontextprotocol/client";
import { getDefaultEnvironment, StdioClientTransport } from "@modelcontextprotocol/client/stdio";

const { E2E_BIN: bin, E2E_API_URL: apiUrl, E2E_SECRET_KEY: secretKey } = process.env;
const LIVE_KEY = `sk_live_${"0".repeat(32)}`;

async function connect(key, era) {
  const client = new Client({ name: "perly-pay-mcp-e2e", version: "1.0.0" }, era === "auto" ? { versionNegotiation: { mode: "auto" } } : undefined);
  await client.connect(
    new StdioClientTransport({
      command: bin,
      env: { ...getDefaultEnvironment(), PERLY_PAY_SECRET_KEY: key, PERLY_PAY_API: apiUrl },
      stderr: "pipe",
    }),
  );
  return client;
}

function textOf(result) {
  return result.content.map((c) => c.text).join("\n");
}

async function ok(client, name, args) {
  const result = await client.callTool({ name, arguments: args });
  const text = textOf(result);
  assert.ok(!result.isError, `${name} failed: ${text}`);
  assert.ok(!text.includes(secretKey), `${name} repeated the secret key`);
  // The JSON first; an API answer then says its free text is data written by others (SUPPLY3-05).
  return JSON.parse(result.content[0].text);
}

async function refused(client, name, args, words) {
  const result = await client.callTool({ name, arguments: args });
  assert.equal(result.isError, true, `${name} should be refused`);
  assert.match(textOf(result), words);
}

for (const era of ["2025 (initialize)", "auto"]) {
  console.log(`\n— era: ${era}`);
  const client = await connect(secretKey, era);
  const { tools } = await client.listTools();
  const names = tools.map((t) => t.name);
  for (const want of ["create_product", "create_price", "create_payment_link", "simulate_payment", "list_payments", "verify_webhook_signature", "pay_links"]) {
    assert.ok(names.includes(want), `no ${want} tool`);
  }
  assert.ok(names.length <= 40, `${names.length} tools: over Cursor's 40`);
  console.log(`  ${names.length} tools`);

  const stamp = Date.now();
  const product = await ok(client, "create_product", { name: `MCP e2e consult ${stamp}`, description: "One hour, booked by an assistant." });
  assert.match(product.id, /^prod_/);
  const price = await ok(client, "create_price", { product: product.id, model: "one_time", unit_amount: 4900, currency: "USD" });
  assert.match(price.id, /^price_/);
  const link = await ok(client, "create_payment_link", { price: price.id });
  assert.match(link.id, /^plink_/);
  assert.match(link.url, /\/l\/[A-Za-z0-9_-]+$/, `link url ${link.url}`);
  console.log(`  ${product.id} → ${price.id} → ${link.url}`);

  const simulated = await ok(client, "simulate_payment", { payment_link: link.id });
  const invoice = simulated.invoice;
  assert.equal(invoice.status, "paid", `invoice is ${invoice.status}`);
  console.log(`  simulated: ${invoice.id} ${invoice.status}`);

  const payments = await ok(client, "list_payments", { invoice: invoice.id });
  assert.equal(payments.object, "list");
  assert.ok(payments.data.length >= 1, "list_payments shows no payment for the invoice");
  assert.equal(payments.data[0].invoice, invoice.id);
  console.log(`  payment: ${payments.data[0].id} ${payments.data[0].asset} on ${payments.data[0].chain}`);

  const events = await ok(client, "list_events", { limit: 20 });
  assert.ok(events.data.some((e) => e.type === "invoice.paid"), "no invoice.paid event");

  // Refusals before anything is sent.
  await refused(client, "cancel_invoice", { id: invoice.id }, /confirm/);
  await refused(client, "create_price", { product: product.id, model: "one_time", unit_amount: "lots" }, /validation|integer/i);

  // The local tools.
  const linksOut = await ok(client, "pay_links", { topic: "connect_wallet" });
  assert.equal(linksOut.links[0].url, `${apiUrl}/dashboard/wallets`);
  await client.close();

  // A live key: what moves money or deletes is refused with why, and the key never comes back.
  const live = await connect(LIVE_KEY, era);
  await refused(live, "simulate_payment", { id: invoice.id }, /Refused with a live key/);
  await refused(live, "create_refund", { invoice: invoice.id, confirm: true }, /real money/);
  await refused(live, "delete_webhook_endpoint", { id: "we_1", confirm: true }, /Deleting with a live key/);
  const unknown = await live.callTool({ name: "list_products", arguments: {} });
  assert.equal(unknown.isError, true);
  assert.ok(!textOf(unknown).includes(LIVE_KEY), "the live key came back");
  await live.close();
  console.log("  refusals: confirm, validation, live key ✓");
}
