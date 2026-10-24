# perly-pay-mcp

Sell your work for crypto from your AI coding assistant. `perly-pay-mcp` is a
local [MCP](https://modelcontextprotocol.io) server for
[Perly Pay](https://pay.perly.io): your assistant can create products, prices,
payment links and invoices, pay them in test mode, read payments and receipts,
and check a buyer's access. Bitcoin, USDC and USDT land straight in your own
wallet; Perly Pay never holds them.

It runs on your machine over stdio and talks only to Perly Pay's public API
with your key. There is no server of ours in between.

## Set up

Get a test key in Perly Pay: **Dashboard → Developers → API keys** (`sk_test_…`).

**Claude Code**

```bash
claude mcp add perly-pay --env PERLY_PAY_SECRET_KEY=sk_test_… -- npx -y perly-pay-mcp
```

**Cursor**: `~/.cursor/mcp.json`, or `.cursor/mcp.json` in a project

```json
{
  "mcpServers": {
    "perly-pay": {
      "command": "npx",
      "args": ["-y", "perly-pay-mcp"],
      "env": { "PERLY_PAY_SECRET_KEY": "sk_test_…" }
    }
  }
}
```

**Codex**: `~/.codex/config.toml`

```toml
[mcp_servers.perly-pay]
command = "npx"
args = ["-y", "perly-pay-mcp"]
env = { PERLY_PAY_SECRET_KEY = "sk_test_…" }
```

Keep the key out of git: a config file in a project is often committed. Node 20
or newer.

| Variable | |
| --- | --- |
| `PERLY_PAY_SECRET_KEY` | `sk_test_…` while you build. `sk_live_…` works too, with the limits below. |
| `PERLY_PAY_API` | Default `https://pay.perly.io`. Plain `http` only for `localhost`. |
| `PERLY_PAY_WEBHOOK_SECRET` | Optional `whsec_…`, the default for `verify_webhook_signature`. |

## Try it

> Sell a one-hour consultation for $49 with a payment link, then pay it in test mode and show me the payment.

The assistant calls `create_product`, `create_price`, `create_payment_link`,
`simulate_payment` and `list_payments`.

## Tools

| Area | Tools |
| --- | --- |
| Products and prices | `create_product`, `list_products`, `update_product`, `create_price`, `list_prices`, `update_price` |
| Payment links | `create_payment_link`, `list_payment_links`, `update_payment_link` |
| Invoices and checkout | `create_invoice`, `list_invoices`, `retrieve_invoice`, `cancel_invoice`, `create_checkout_session`, `retrieve_checkout_session` |
| Customers | `create_customer`, `list_customers`, `retrieve_customer` |
| Subscriptions (renewed by invoice) | `create_subscription`, `list_subscriptions`, `retrieve_subscription` |
| Access and credits | `check_entitlement`, `list_entitlements`, `consume_entitlement_credits`, `list_credit_usage` |
| Money in, read only | `list_payments`, `retrieve_payment`, `list_receipts`, `retrieve_receipt`, `list_events` |
| Refunds | `create_refund`, `list_refunds` |
| Webhooks | `create_webhook_endpoint`, `list_webhook_endpoints`, `delete_webhook_endpoint` |
| Test mode | `simulate_payment`: pays an invoice, or buys from a payment link and pays that |
| On your machine | `verify_webhook_signature` checks a `Perly-Signature`; `pay_links` gives the dashboard pages only you can use: plan, wallet, go live, two-factor, keys |

The tools are generated from Perly Pay's OpenAPI document, so their arguments
are the API's own.

## What it will not do

- **With a live key**, it refuses anything that moves or redirects money,
  spends a buyer's credits or deletes: simulated payments, refunds, credit
  spending, new or deleted webhook endpoints. It says why and where you do it.
  Reading, and making products, prices, links and invoices, work as in test.
- **Wallets, API keys, plans, live mode and two-factor** have no tool at all.
  You set them in the dashboard; `pay_links` gives the pages.
- **What cannot be undone** (cancelling an invoice, opening a refund, deleting
  a webhook endpoint) waits for `confirm: true`, which the assistant should
  only send after asking you.
- **Your secret key is never repeated** in an answer or a log.
- **Text others wrote is marked as data.** Customer names, emails, descriptions
  and metadata can come from buyers, or from anyone who opens a payment link;
  every API answer ends with a note telling the assistant not to follow them.
  Still read what a tool is about to change before you approve it.

Docs: <https://pay.perly.io/docs/mcp>. API reference:
<https://pay.perly.io/docs/api>. MIT licence.

## Source

This is the source of the `perly-pay-mcp` package on npm, copied from Perly Pay's own repository on each release (paths in comments such as `packages/…` refer to that layout). Issues and pull requests are welcome here.
