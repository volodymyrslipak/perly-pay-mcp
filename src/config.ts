/**
 * What the server is started with, from its environment:
 *
 *   PERLY_PAY_SECRET_KEY      sk_test_… or sk_live_… (Dashboard → Developers)
 *   PERLY_PAY_API         default https://pay.perly.io (http only for this machine)
 *   PERLY_PAY_WEBHOOK_SECRET  optional whsec_…, the default for verify_webhook_signature
 *
 * A missing or wrong key does not stop the server: every API tool answers
 * how to set it, which an assistant can repeat, where a server that exits
 * shows only "failed to connect".
 */

export type Mode = "test" | "live";

export interface Config {
  secretKey: string | null;
  mode: Mode | null;
  /** Why the key cannot be used, in one sentence; null when it can. */
  keyProblem: string | null;
  /** The site, e.g. https://pay.perly.io — the dashboard's pages hang off it. */
  siteUrl: string;
  /** The API, `${siteUrl}/api/v1`. */
  apiUrl: string;
  /** Why the URL cannot be used; null when it can. */
  urlProblem: string | null;
  webhookSecret: string | null;
}

export const DEFAULT_SITE_URL = "https://pay.perly.io";

const KEY = /^sk_(test|live)_[0-9A-Za-z]{32}$/;
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);

/** The key's mode from its prefix, or why it is not a key. */
export function checkKey(raw: string | undefined): { key: string | null; mode: Mode | null; problem: string | null } {
  const key = raw?.trim() ?? "";
  if (!key) {
    return { key: null, mode: null, problem: "No secret key. Set PERLY_PAY_SECRET_KEY to your sk_test_… key (Dashboard → Developers) in this MCP server's config." };
  }
  if (key.startsWith("whsec_")) return { key: null, mode: null, problem: "PERLY_PAY_SECRET_KEY holds a webhook signing secret (whsec_…), not a secret key (sk_test_…)." };
  const match = KEY.exec(key);
  if (!match) return { key: null, mode: null, problem: "PERLY_PAY_SECRET_KEY is not a Perly Pay secret key: it starts sk_test_ or sk_live_, then 32 letters and digits." };
  return { key, mode: match[1] as Mode, problem: null };
}

/** The site's origin from PERLY_PAY_API, with or without `/api/v1`. Plain http only to this machine: a key never crosses a network unencrypted. */
export function checkUrl(raw: string | undefined): { siteUrl: string; problem: string | null } {
  const text = raw?.trim() || DEFAULT_SITE_URL;
  let url: URL;
  try {
    url = new URL(text);
  } catch {
    return { siteUrl: DEFAULT_SITE_URL, problem: `PERLY_PAY_API is not a URL: ${text}` };
  }
  const local = LOCAL_HOSTS.has(url.hostname) || url.hostname.endsWith(".localhost");
  if (url.protocol !== "https:" && !(url.protocol === "http:" && local)) {
    return { siteUrl: DEFAULT_SITE_URL, problem: "PERLY_PAY_API must be https (plain http only for localhost)." };
  }
  const path = url.pathname.replace(/\/+$/, "").replace(/\/api\/v1$/, "");
  return { siteUrl: `${url.origin}${path}`, problem: null };
}

export function readConfig(env: Record<string, string | undefined>): Config {
  const key = checkKey(env.PERLY_PAY_SECRET_KEY);
  const url = checkUrl(env.PERLY_PAY_API);
  const webhookSecret = env.PERLY_PAY_WEBHOOK_SECRET?.trim() || null;
  return {
    secretKey: key.key,
    mode: key.mode,
    keyProblem: key.problem,
    siteUrl: url.siteUrl,
    apiUrl: `${url.siteUrl}/api/v1`,
    urlProblem: url.problem,
    webhookSecret,
  };
}

/** Takes any secret key out of text before it reaches the assistant: the configured one, and anything shaped like one. */
export function redact(text: string, secretKey: string | null): string {
  let out = secretKey ? text.split(secretKey).join("sk_…[hidden]") : text;
  out = out.replace(/sk_(test|live)_[0-9A-Za-z]{8,}/g, "sk_$1_…[hidden]");
  return out;
}
