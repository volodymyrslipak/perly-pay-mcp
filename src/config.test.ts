import { describe, expect, it } from "vitest";
import { checkKey, checkUrl, readConfig } from "./config";

describe("the server's config", () => {
  it("reads the mode from the key's prefix", () => {
    expect(checkKey(`sk_test_${"A".repeat(32)}`).mode).toBe("test");
    expect(checkKey(` sk_live_${"9".repeat(32)} `).mode).toBe("live");
    expect(checkKey("sk_test_short").problem).toContain("32 letters");
    expect(checkKey(undefined).problem).toContain("PERLY_PAY_SECRET_KEY");
  });

  it("takes the site with or without /api/v1, https or this machine only", () => {
    expect(checkUrl(undefined)).toEqual({ siteUrl: "https://pay.perly.io", problem: null });
    expect(checkUrl("http://localhost:3272/api/v1/").siteUrl).toBe("http://localhost:3272");
    expect(checkUrl("http://127.0.0.1:3200").problem).toBeNull();
    expect(checkUrl("http://pay.test.localhost:3200").problem).toBeNull();
    expect(checkUrl("http://pay.example.com").problem).toContain("https");
    expect(checkUrl("not a url").problem).toContain("not a URL");
  });

  it("puts the API under the site", () => {
    expect(readConfig({ PERLY_PAY_API: "https://staging.pay.example.com" }).apiUrl).toBe("https://staging.pay.example.com/api/v1");
  });
});
