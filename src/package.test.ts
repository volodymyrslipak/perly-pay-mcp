import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { MCP_VERSION } from "./api";
import { readConfig } from "./config";
import { createToolbox } from "./toolbox";

/**
 * What npm will publish as `perly-pay-mcp` (the owner publishes by hand,
 * docs/PUBLISHING.md): one pinned dependency, the build, the README, the
 * licence, and the version the server reports.
 */
const root = new URL("../", import.meta.url);
const pkg = JSON.parse(readFileSync(new URL("package.json", root), "utf8")) as Record<string, unknown>;

describe("the npm package", () => {
  it("is publishable under its name, MIT, with a bin that npx runs", () => {
    expect(pkg.name).toBe("perly-pay-mcp");
    expect(pkg.private).toBeUndefined();
    expect(pkg.license).toBe("MIT");
    expect(readFileSync(new URL("LICENSE", root), "utf8")).toMatch(/^MIT License/);
    expect(pkg.bin).toEqual({ "perly-pay-mcp": "dist/cli.js" });
    expect(readFileSync(new URL("src/cli.ts", root), "utf8")).toMatch(/^#!\/usr\/bin\/env node\n/);
  });

  it("reports the version it is published as", () => {
    expect(MCP_VERSION).toBe(pkg.version);
  });

  it("is what server.json tells the MCP Registry", () => {
    const server = JSON.parse(readFileSync(new URL("server.json", root), "utf8")) as {
      name: string;
      description: string;
      version: string;
      packages: { identifier: string; version: string }[];
    };
    expect(server.name).toBe(pkg.mcpName);
    expect(server.version).toBe(pkg.version);
    expect(server.packages).toEqual([expect.objectContaining({ identifier: pkg.name, version: pkg.version })]);
    expect(server.description.length).toBeLessThanOrEqual(100);
  });

  it("ships only the build, the README and the licence", () => {
    expect(pkg.files).toEqual(["dist", "README.md", "LICENSE"]);
    expect((pkg.scripts as Record<string, string>).prepack).toBe("npm run build");
  });

  it("depends on the official MCP SDK alone, at an exact version", () => {
    const deps = pkg.dependencies as Record<string, string>;
    expect(Object.keys(deps)).toEqual(["@modelcontextprotocol/server"]);
    expect(deps["@modelcontextprotocol/server"]).toMatch(/^\d+\.\d+\.\d+$/);
    expect(pkg.devDependencies).toBeUndefined();
  });

  it("its README lists every tool, and no tool it does not have", () => {
    const readme = readFileSync(new URL("README.md", root), "utf8");
    const tools = createToolbox(readConfig({}), { fetch: globalThis.fetch }).tools.map((t) => t.name);
    const table = readme.slice(readme.indexOf("## Tools"), readme.indexOf("## What it will not do"));
    const named = [...table.matchAll(/`([a-z]+(?:_[a-z]+)+)`/g)].map((m) => m[1]);
    expect(new Set(named)).toEqual(new Set(tools));
  });

  it("its Dockerfile, which Glama and Docker's catalogue build, compiles with the repo's TypeScript and runs the bin", () => {
    const dockerfile = readFileSync(new URL("Dockerfile", root), "utf8");
    const repoTs = JSON.parse(readFileSync(new URL("../../node_modules/typescript/package.json", root), "utf8")) as { version: string };
    expect(dockerfile).toContain(`typescript@${repoTs.version} `);
    expect(dockerfile).toContain(`ENTRYPOINT ["node", "${(pkg.bin as Record<string, string>)["perly-pay-mcp"]}"]`);
  });
});
