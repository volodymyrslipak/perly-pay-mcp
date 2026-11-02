/**
 * Which of the API's operations an assistant gets as a tool, and on what
 * terms. Every operation in the OpenAPI document is named here, exposed or
 * left out with a reason: `operations.drift.test.ts` fails when the API
 * gains one this table does not decide on, so a new endpoint is a choice,
 * never an accident.
 *
 * The line it draws: an assistant may build and test a shop end to end with a
 * test key. With a live key the server only reads: every tool that writes
 * (creating invoices, sessions, products, prices, customers, links and
 * subscriptions as well as every edit, cancel, refund and delete) is refused
 * with why, and the person does it in the dashboard (`pay_links`) or their
 * app's own code (mcp/no-person-bound-approval, after AUTHZ-06).
 *
 * Why refuse rather than ask: text from a buyer can reach the assistant
 * (names, descriptions, metadata), and nothing the server receives proves a
 * person approved a call. `confirm: true` is an argument the same model
 * writes; a client's approval prompt is the client's, unseen here; and an
 * MCP elicitation answer comes back through that same client, which the
 * server cannot tell from the model. The API key has no scopes either, so
 * the server is the only place the line can be held. With no clean way to
 * get a person's approval the model cannot fake, a live key reads and never
 * writes. `toolbox.ts` holds the floor too: with a live key any call that is
 * not a GET is refused, whatever this table says. Wallets, API keys, plans
 * and live mode have no endpoint at all; an assistant can only point at the
 * page.
 */

export interface Exposed {
  expose: true;
  /** `refuse`: with a live key the tool answers why, and sends nothing. */
  live: "allow" | "refuse";
  /** Why a live key is refused, said to the assistant (and so to the person). */
  liveWhy?: string;
  /** The call does something that cannot be taken back: it needs `confirm: true`. */
  confirm?: string;
}

export interface Excluded {
  expose: false;
  why: string;
}

export type Decision = Exposed | Excluded;

const allow: Exposed = { expose: true, live: "allow" };

/** Why a live key writes nothing through an assistant (mcp/no-person-bound-approval). */
export const LIVE_READ_ONLY =
  "With a live key this server only reads: nothing here can prove a person approved a live change. Do it in the dashboard, or in your app's own code with the SDK; try it here with a test key (sk_test_…).";

/** A write: free with a test key, refused with a live one. */
const testOnlyWrite: Exposed = { expose: true, live: "refuse", liveWhy: LIVE_READ_ONLY };

/** A live key does not change what buyers already see (AUTHZ-06). */
const testOnlyEdit: Exposed = { expose: true, live: "refuse", liveWhy: "Changing what is on sale, or where its buyers land, is for the dashboard when real buyers are looking. Try it with a test key." };

/**
 * Some clients read only so many tools (Cursor stops at 40, across every
 * server), so the set stays under that: where a list or another tool
 * already answers, the extra call is left out.
 */
const covered = (by: string): Excluded => ({ expose: false, why: `Covered by ${by}; left out to keep the set under clients' tool limits.` });

export const CURATION: Readonly<Record<string, Decision>> = {
  createInvoice: testOnlyWrite,
  listInvoices: allow,
  retrieveInvoice: allow,
  cancelInvoice: { ...testOnlyWrite, confirm: "Cancels the invoice: its buyer can no longer pay it." },
  simulatePayment: {
    expose: true,
    live: "refuse",
    liveWhy: "Simulated payments exist only in test mode. Use a test key (sk_test_…) to try the flow.",
  },

  createCheckoutSession: testOnlyWrite,
  listCheckoutSessions: covered("retrieve_checkout_session and list_invoices"),
  retrieveCheckoutSession: allow,
  expireCheckoutSession: covered("the session's own expiry (expires_in_minutes)"),
  openCheckoutSession: { expose: false, why: "The buyer's page (pay.js opens it), not a merchant call." },

  createProduct: testOnlyWrite,
  listProducts: allow,
  retrieveProduct: covered("list_products"),
  updateProduct: testOnlyEdit,

  createPrice: testOnlyWrite,
  listPrices: allow,
  retrievePrice: covered("list_prices"),
  updatePrice: testOnlyEdit,

  createCustomer: testOnlyWrite,
  listCustomers: allow,
  retrieveCustomer: allow,
  updateCustomer: covered("create_customer (customers are found or made by email)"),

  createSubscription: testOnlyWrite,
  listSubscriptions: allow,
  retrieveSubscription: allow,
  updateSubscription: { expose: false, why: "Changing a subscriber's plan or quantity is the merchant's call, in the dashboard or their code." },
  cancelSubscription: { expose: false, why: "Ends a buyer's access; the merchant's call, in the dashboard or their code." },
  pauseSubscription: { expose: false, why: "Stops a buyer's billing; the merchant's call, in the dashboard or their code." },
  resumeSubscription: { expose: false, why: "Restarts a buyer's billing; the merchant's call, in the dashboard or their code." },
  prepaySubscription: { expose: false, why: "Bills a buyer ahead; the merchant's call, in the dashboard or their code." },

  createPaymentLink: testOnlyWrite,
  listPaymentLinks: allow,
  retrievePaymentLink: covered("list_payment_links"),
  updatePaymentLink: testOnlyEdit,

  createCoupon: { expose: false, why: "Not in the first set: discounts are made in the dashboard." },
  listCoupons: { expose: false, why: "Not in the first set: discounts are made in the dashboard." },
  retrieveCoupon: { expose: false, why: "Not in the first set: discounts are made in the dashboard." },
  updateCoupon: { expose: false, why: "Not in the first set: discounts are made in the dashboard." },

  checkEntitlement: allow,
  listEntitlements: allow,
  retrieveEntitlement: covered("check_entitlement and list_entitlements"),
  consumeEntitlementCredits: {
    expose: true,
    live: "refuse",
    liveWhy: "Spending a real buyer's credits is for your app's own code (the SDK's credits helpers), not an assistant. Try it with a test key.",
  },

  retrieveCreditBalance: covered("check_entitlement (its credits_remaining)"),
  consumeCredits: covered("consume_entitlement_credits, which refuses a live key for the same reason"),
  listCreditUsage: allow,

  validateLicenseKey: { expose: false, why: "Called by the merchant's software on a buyer's machine, with the buyer's key." },
  activateLicenseKey: { expose: false, why: "Called by the merchant's software on a buyer's machine, with the buyer's key." },
  deactivateLicenseKey: { expose: false, why: "Called by the merchant's software on a buyer's machine, with the buyer's key." },
  listLicenseKeys: { expose: false, why: "Buyers' license keys are secrets; they stay in the dashboard." },
  retrieveLicenseKey: { expose: false, why: "Buyers' license keys are secrets; they stay in the dashboard." },
  revokeLicenseKey: { expose: false, why: "Takes a buyer's software away; the merchant's call, in the dashboard." },

  createPortalSession: { expose: false, why: "A sign-in link for one buyer; made by the merchant's app when that buyer asks." },

  listPayments: allow,
  retrievePayment: allow,

  quoteRefund: covered("create_refund and list_refunds"),
  createRefund: {
    expose: true,
    live: "refuse",
    liveWhy: "A live refund is real money sent from your own wallet. Open it in the dashboard (pay_links: refunds).",
    confirm: "Opens a refund to the buyer.",
  },
  listRefunds: allow,
  retrieveRefund: covered("list_refunds"),
  markRefundSent: { expose: false, why: "Records real money sent; the merchant does it in the dashboard (pay_links: refunds)." },

  listReceipts: allow,
  retrieveReceipt: allow,
  receiptPdf: { expose: false, why: "A binary PDF; retrieve_receipt has every figure, and the receipt's page has the file." },

  listEvents: allow,
  retrieveEvent: covered("list_events"),

  createWebhookEndpoint: {
    expose: true,
    live: "refuse",
    liveWhy: "Sending live events to a new address is set up in the dashboard (pay_links: webhooks).",
  },
  listWebhookEndpoints: allow,
  retrieveWebhookEndpoint: covered("list_webhook_endpoints"),
  updateWebhookEndpoint: covered("delete_webhook_endpoint and create_webhook_endpoint"),
  deleteWebhookEndpoint: {
    expose: true,
    live: "refuse",
    liveWhy: "Deleting with a live key is refused. Delete live webhook endpoints in the dashboard.",
    confirm: "Deletes the webhook endpoint: its events stop.",
  },
  rollWebhookSecret: { expose: false, why: "A new signing secret breaks webhook checks until it is deployed; rolled in the dashboard." },
  claimWebhookDelivery: { expose: false, why: "Used up by the app that received the delivery (Zapier, Make); an assistant claiming one would stop that app's run." },
};

/** `createPaymentLink` → `create_payment_link`. */
export function toolName(operationId: string): string {
  return operationId.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
}
