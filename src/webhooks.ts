/**
 * Checks a webhook's signature on this machine, the same scheme as the
 * SDKs (packages/sdk/src/webhooks.ts; webhooks.test.ts holds the two
 * together):
 *
 *   Perly-Signature: t=<unix seconds>,v1=<hex HMAC-SHA256(secret, t + "." + rawBody)>
 *
 * Nothing leaves the machine and the secret is never repeated back.
 */
import { createHmac, timingSafeEqual } from "node:crypto";

export const DEFAULT_TOLERANCE_SECONDS = 300;

export type Verdict =
  | { valid: true; event: { id: unknown; type: unknown; livemode: unknown } | null; note?: string }
  | { valid: false; code: string; reason: string };

export function computeSignature(secret: string, timestamp: number, body: string): string {
  return createHmac("sha256", secret).update(`${timestamp}.${body}`).digest("hex");
}

function parseHeader(header: string): { timestamp: number; signatures: string[] } | null {
  let timestamp: number | null = null;
  const signatures: string[] = [];
  for (const part of header.split(",")) {
    const [k, ...rest] = part.trim().split("=");
    const v = rest.join("=");
    if (k === "t" && /^\d{1,12}$/.test(v)) timestamp = Number(v);
    else if (k === "v1" && /^[0-9a-f]{64}$/i.test(v)) signatures.push(v.toLowerCase());
  }
  return timestamp === null || signatures.length === 0 ? null : { timestamp, signatures };
}

export function verifySignature(
  body: string,
  header: string,
  secret: string,
  options: { toleranceSeconds?: number; now?: number } = {},
): Verdict {
  if (!secret) return { valid: false, code: "no_secret", reason: "Pass the endpoint's signing secret (whsec_…), or set PERLY_PAY_WEBHOOK_SECRET." };
  // A header pasted with its name ("Perly-Signature: t=…") is read as the value.
  const value = header.replace(/^\s*perly-signature\s*:\s*/i, "");
  const parsed = parseHeader(value);
  if (!parsed) return { valid: false, code: "malformed_signature", reason: "The signature is not t=…,v1=…." };
  const now = options.now ?? Math.floor(Date.now() / 1000);
  const tolerance = options.toleranceSeconds ?? DEFAULT_TOLERANCE_SECONDS;
  if (Math.abs(now - parsed.timestamp) > tolerance) {
    return { valid: false, code: "timestamp_out_of_tolerance", reason: `The signature is more than ${tolerance} seconds old (or from the future): a replay, or a stale copy.` };
  }
  const expected = Buffer.from(computeSignature(secret, parsed.timestamp, body), "hex");
  const matches = parsed.signatures.some((s) => {
    const given = Buffer.from(s, "hex");
    return given.length === expected.length && timingSafeEqual(given, expected);
  });
  if (!matches) {
    return { valid: false, code: "signature_mismatch", reason: "The signature does not match: a different secret, or a body changed after it was signed (verify the raw bytes, before JSON parsing)." };
  }
  try {
    const event = JSON.parse(body) as Record<string, unknown>;
    return { valid: true, event: { id: event.id, type: event.type, livemode: event.livemode } };
  } catch {
    return { valid: true, event: null, note: "Signed correctly, but the body is not JSON." };
  }
}
