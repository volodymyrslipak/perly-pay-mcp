/**
 * What only a person can do, and where: the dashboard pages behind the
 * steps no API key may take — paying a bill, connecting a wallet, going
 * live, two-factor sign-in, keys and live webhooks, live refunds.
 */

export const LINK_TOPICS = ["billing", "connect_wallet", "go_live", "two_factor", "api_keys", "webhooks", "refunds", "checklist"] as const;
export type LinkTopic = (typeof LINK_TOPICS)[number];

const LINKS: Readonly<Record<LinkTopic, { path: string; what: string }>> = {
  billing: { path: "/dashboard/billing", what: "See and pay your Perly Pay bill: 2.5¢ a payment, never more than 0.5% of it, billed on the 1st." },
  connect_wallet: {
    path: "/dashboard/wallets",
    what: "Connect a wallet by its PUBLIC key or address. Payments land there directly; Perly Pay never asks for a seed or private key.",
  },
  go_live: { path: "/dashboard/wallets", what: "Turn on live mode once a wallet is connected. Test mode stays as it is." },
  two_factor: { path: "/dashboard/settings/security", what: "Set up two-factor sign-in (a passkey or an authenticator app)." },
  api_keys: { path: "/dashboard/developers", what: "Make, roll or revoke secret keys (sk_test_…, sk_live_…)." },
  webhooks: { path: "/dashboard/developers", what: "Add, change or delete live webhook endpoints and roll their signing secrets." },
  refunds: { path: "/dashboard/refunds", what: "Refund a live payment: you send it from your own wallet, then record the transaction." },
  checklist: { path: "/dashboard/integrate", what: "What is left before the first real payment, ticked off as it is done." },
};

export function link(siteUrl: string, topic: LinkTopic): { topic: LinkTopic; url: string; what: string } {
  const { path, what } = LINKS[topic];
  return { topic, url: `${siteUrl}${path}`, what };
}

export function links(siteUrl: string, topic?: LinkTopic): { topic: LinkTopic; url: string; what: string }[] {
  return (topic ? [topic] : LINK_TOPICS).map((t) => link(siteUrl, t));
}
