/**
 * verify_webhook_signature checks the same scheme the API signs with and the
 * Node SDK verifies: a signature one makes, the other accepts, and both
 * refuse the same tampering.
 */
import { describe, expect, it } from "vitest";
import { sign as sdkSign, verify as sdkVerify } from "../../sdk/src/webhooks";
import { computeSignature, verifySignature } from "./webhooks";

const secret = "whsec_0123456789abcdef";
const body = JSON.stringify({ id: "evt_42", object: "event", type: "invoice.fulfilled", livemode: false, data: { object: { id: "inv_1" } } });
const now = 1_800_000_000;

describe("webhook signatures", () => {
  it("accepts what the SDK signs, and the SDK accepts what this computes", () => {
    expect(verifySignature(body, sdkSign(body, secret, now), secret, { now })).toMatchObject({ valid: true, event: { id: "evt_42", type: "invoice.fulfilled" } });
    expect(() => sdkVerify(body, `t=${now},v1=${computeSignature(secret, now, body)}`, secret, { now })).not.toThrow();
  });

  it("accepts any v1 during a secret roll", () => {
    const header = `t=${now},v1=${"0".repeat(64)},v1=${computeSignature(secret, now, body)}`;
    expect(verifySignature(body, header, secret, { now }).valid).toBe(true);
  });

  it("refuses what the SDK refuses", () => {
    const header = sdkSign(body, secret, now);
    for (const [b, h, s, code] of [
      [body.replace("42", "43"), header, secret, "signature_mismatch"],
      [body, header, "whsec_other", "signature_mismatch"],
      [body, "v1=abc", secret, "malformed_signature"],
      [body, sdkSign(body, secret, now - 301), secret, "timestamp_out_of_tolerance"],
      [body, header, "", "no_secret"],
    ] as const) {
      expect(verifySignature(b, h, s, { now })).toMatchObject({ valid: false, code });
      expect(() => sdkVerify(b, h, s, { now })).toThrow();
    }
  });

  it("a signed body that is not JSON is still a valid signature, said so", () => {
    expect(verifySignature("plain", sdkSign("plain", secret, now), secret, { now })).toMatchObject({ valid: true, event: null });
  });
});
