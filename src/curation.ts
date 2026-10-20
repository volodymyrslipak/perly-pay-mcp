/**
 * Which of the API's operations an assistant gets as a tool, and on what
 * terms. Every operation in the OpenAPI document is named here, exposed or
 * left out with a reason: `operations.drift.test.ts` fails when the API
 * gains one this table does not decide on, so a new endpoint is a choice,
 * never an accident.
 *
 * The line it draws: an assistant may build and test a shop end to end, and
 * read a live one. With a live key it may not move or redirect money, send
 * live events somewhere new, spend a buyer's credits or delete anything —
 * those are for the merchant, in the dashboard (`pay_links`), or for their
 * app's own code. Wallets, API keys, plans and live mode have no endpoint at
 * all; an assistant can only point at the page.
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

/**
 * Some clients read only so many tools (Cursor stops at 40, across every
 * server), so the set stays under that: where a list or another tool
 * already answers, the extra call is left out.
 */
const covered = (by: string): Excluded => ({ expose: false, why: `Covered by ${by}; left out to keep the set under clients' tool limits.` });

export const CURATION: Readonly<Record<string, Decision>> = {
  createInvoice: allow,
  listInvoices: allow,
  retrieveInvoice: allow,
  cancelInvoice: { ...allow, confirm: "Cancels the invoice: its buyer can no longer pay it." },
  simulatePayment: {
    expose: true,
    live: "refuse",
    liveWhy: "Simulated payments exist only in test mode. Use a test key (sk_test_…) to try the flow.",
  },

  createCheckoutSession: allow,
  listCheckoutSessions: covered("retrieve_checkout_session and list_invoices"),
  retrieveCheckoutSession: allow,
  expireCheckoutSession: covered("the session's own expiry (expires_in_minutes)"),
  openCheckoutSession: { expose: false, why: "The buyer's page (pay.js opens it), not a merchant call." },

  createProduct: allow,
  listProducts: allow,
  retrieveProduct: covered("list_products"),
  updateProduct: allow,

  createPrice: allow,
  listPrices: allow,
  retrievePrice: covered("list_prices"),
  updatePrice: allow,

  createCustomer: allow,
  listCustomers: allow,
  retrieveCustomer: allow,
  updateCustomer: covered("create_customer (customers are found or made by email)"),

  createSubscription: allow,
  listSubscriptions: allow,
  retrieveSubscription: allow,
  updateSubscription: { expose: false, why: "Changing a subscriber's plan or quantity is the merchant's call, in the dashboard or their code." },
  cancelSubscription: { expose: false, why: "Ends a buyer's access; the merchant's call, in the dashboard or their code." },
  pauseSubscription: { expose: false, why: "Stops a buyer's billing; the merchant's call, in the dashboard or their code." },
  resumeSubscription: { expose: false, why: "Restarts a buyer's billing; the merchant's call, in the dashboard or their code." },
  prepaySubscription: { expose: false, why: "Bills a buyer ahead; the merchant's call, in the dashboard or their code." },

  createPaymentLink: allow,
  listPaymentLinks: allow,
  retrievePaymentLink: covered("list_payment_links"),
  updatePaymentLink: allow,

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
};

/** `createPaymentLink` → `create_payment_link`. */
export function toolName(operationId: string): string {
  return operationId.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
}
