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

  it("sends the key only to perly.io or this machine (AUTHZ-12)", () => {
    expect(checkUrl("https://pay.perly.io").problem).toBeNull();
    expect(checkUrl("https://pay-dev.perly.io/api/v1").siteUrl).toBe("https://pay-dev.perly.io");
    expect(checkUrl("https://localhost:3200").problem).toBeNull();
    for (const elsewhere of ["https://evil.example", "https://pay.perly.io.evil.example", "https://evilperly.io", "https://pay.perly.io@evil.example"]) {
      const { siteUrl, problem } = checkUrl(elsewhere);
      expect(problem).toContain("PERLY_PAY_ALLOW_ANY_API");
      expect(siteUrl).toBe("https://pay.perly.io");
    }
  });

  it("takes another host only when told to, and never a user name in the address", () => {
    expect(checkUrl("https://staging.pay.example.com", true).problem).toBeNull();
    expect(checkUrl("https://me:secret@pay.perly.io", true).problem).toContain("user name");
    expect(checkUrl("https://me@pay.perly.io").problem).toContain("user name");
    expect(checkUrl("http://pay.example.com", true).problem).toContain("https");
  });

  it("puts the API under the site", () => {
    expect(readConfig({ PERLY_PAY_API: "https://staging.pay.example.com", PERLY_PAY_ALLOW_ANY_API: "1" }).apiUrl).toBe("https://staging.pay.example.com/api/v1");
    expect(readConfig({ PERLY_PAY_API: "https://staging.pay.example.com" }).urlProblem).toContain("PERLY_PAY_ALLOW_ANY_API");
  });
});
