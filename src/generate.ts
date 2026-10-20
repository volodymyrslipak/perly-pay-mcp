/**
 * Turns Perly Pay's OpenAPI document into the operations the MCP server
 * exposes: for each operation the curation table exposes, its method and
 * path, its words, and ONE input schema — path parameters, query parameters
 * and the JSON body side by side, the shape a tool call carries.
 *
 * Pure: no app code, no network. `operations.drift.test.ts` runs it on the
 * document the API serves (built from the same zod schemas that validate
 * requests) and holds `operations.generated.ts` to the result.
 */
import { CURATION, toolName } from "./curation.js";

export type Json = Record<string, unknown>;

export interface Operation {
  operationId: string;
  tool: string;
  method: "GET" | "POST" | "DELETE";
  path: string;
  summary: string;
  description?: string;
  /** The API refuses it with a live key (`x-test-mode-only`). */
  testOnly: boolean;
  pathParams: string[];
  queryParams: string[];
  /** The body's top-level fields; empty when the operation takes no body. */
  bodyParams: string[];
  hasBody: boolean;
  inputSchema: Json;
}

interface Parameter {
  name: string;
  in: string;
  required?: boolean;
  description?: string;
  schema?: Json;
}

const METHODS = ["get", "post", "delete"] as const;

function isObject(value: unknown): value is Json {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Every operation in the document, in its order. */
export function operationsOf(doc: Json): { operationId: string; method: Operation["method"]; path: string; op: Json }[] {
  const out: { operationId: string; method: Operation["method"]; path: string; op: Json }[] = [];
  for (const [path, item] of Object.entries((doc.paths ?? {}) as Record<string, Json>)) {
    for (const method of METHODS) {
      const op = item[method];
      if (isObject(op)) out.push({ operationId: String(op.operationId), method: method.toUpperCase() as Operation["method"], path, op });
    }
  }
  return out;
}

function parametersOf(op: Json): Parameter[] {
  // `$ref`ed parameters are the shared Idempotency-Key header, which the server sets itself.
  return ((op.parameters ?? []) as Json[]).filter((p): p is Json & Parameter => !("$ref" in p) && typeof p.name === "string");
}

/** A body that is one of several objects (a price's models) becomes one object: every field any variant has, required only where all require it. */
function flattenBody(schema: Json, where: string): { properties: Record<string, Json>; required: string[] } {
  if (schema.type === "object" && isObject(schema.properties)) {
    return { properties: schema.properties as Record<string, Json>, required: (schema.required as string[] | undefined) ?? [] };
  }
  const variants = (schema.oneOf ?? schema.anyOf) as Json[] | undefined;
  if (!variants?.every((v) => v.type === "object" && isObject(v.properties))) {
    throw new Error(`${where}: the body is neither an object nor a choice of objects`);
  }
  const seen = new Map<string, Json[]>();
  for (const variant of variants) {
    for (const [name, prop] of Object.entries(variant.properties as Record<string, Json>)) {
      const list = seen.get(name) ?? [];
      if (!list.some((p) => JSON.stringify(p) === JSON.stringify(prop))) list.push(prop);
      seen.set(name, list);
    }
  }
  const properties: Record<string, Json> = {};
  for (const [name, list] of seen) {
    if (list.length === 1) properties[name] = list[0]!;
    else if (list.every((p) => p.type === "string" && "const" in p && Object.keys(p).length === 2)) {
      properties[name] = { type: "string", enum: list.map((p) => p.const) };
    } else {
      properties[name] = { anyOf: list };
    }
  }
  const required = ((variants[0]!.required as string[] | undefined) ?? []).filter((name) =>
    variants.every((v) => ((v.required as string[] | undefined) ?? []).includes(name)),
  );
  return { properties, required };
}

function describeFlattened(schema: Json): string | null {
  const variants = (schema.oneOf ?? schema.anyOf) as Json[] | undefined;
  if (!variants) return null;
  const lines = variants.map((v) => {
    const props = v.properties as Record<string, Json>;
    const tag = Object.entries(props).find(([, p]) => "const" in p);
    const req = ((v.required as string[] | undefined) ?? []).join(", ");
    return tag ? `${tag[0]} = ${String(tag[1].const)}: needs ${req}` : `needs ${req}`;
  });
  return `Body is one of: ${lines.join("; ")}.`;
}

export function buildOperation(entry: ReturnType<typeof operationsOf>[number]): Operation {
  const { operationId, method, path, op } = entry;
  const where = `${method} ${path} (${operationId})`;
  const properties: Record<string, Json> = {};
  const required: string[] = [];
  const add = (name: string, schema: Json, isRequired: boolean, kind: string) => {
    if (name in properties) throw new Error(`${where}: "${name}" is both a ${kind} field and another kind of field`);
    properties[name] = schema;
    if (isRequired) required.push(name);
  };

  const pathParams: string[] = [];
  const queryParams: string[] = [];
  for (const p of parametersOf(op)) {
    if (p.in === "path") {
      pathParams.push(p.name);
      add(p.name, { type: "string", description: p.description ?? "The object's id." }, true, "path");
    } else if (p.in === "query") {
      queryParams.push(p.name);
      add(p.name, { ...(p.schema ?? {}), ...(p.description ? { description: p.description } : {}) }, p.required ?? false, "query");
    }
  }
  for (const name of path.match(/\{(\w+)\}/g)?.map((m) => m.slice(1, -1)) ?? []) {
    if (!pathParams.includes(name)) throw new Error(`${where}: path parameter {${name}} is not declared`);
  }

  const bodySchema = ((op.requestBody as Json | undefined)?.content as Record<string, Json> | undefined)?.["application/json"]?.schema as
    | Json
    | undefined;
  const bodyParams: string[] = [];
  let note: string | null = null;
  if (bodySchema) {
    if (JSON.stringify(bodySchema).includes('"$ref"')) throw new Error(`${where}: the body refers to a shared schema; inline it`);
    const flat = flattenBody(bodySchema, where);
    note = describeFlattened(bodySchema);
    for (const [name, schema] of Object.entries(flat.properties)) {
      bodyParams.push(name);
      add(name, schema, flat.required.includes(name), "body");
    }
  }

  const description = [op.description, note].filter((s): s is string => typeof s === "string" && s.length > 0).join("\n\n");
  return {
    operationId,
    tool: toolName(operationId),
    method,
    path,
    summary: String(op.summary),
    ...(description ? { description } : {}),
    testOnly: op["x-test-mode-only"] === true,
    pathParams,
    queryParams,
    bodyParams,
    hasBody: Boolean(bodySchema),
    inputSchema: {
      type: "object",
      properties,
      ...(required.length ? { required } : {}),
      additionalProperties: false,
    },
  };
}

/** The exposed operations, in the document's order. */
export function buildOperations(doc: Json): Operation[] {
  return operationsOf(doc)
    .filter((entry) => CURATION[entry.operationId]?.expose === true)
    .map(buildOperation);
}

/** The operations as the source of `operations.generated.ts`. */
export function renderOperations(operations: readonly Operation[]): string {
  return [
    "/*",
    " * GENERATED from Perly Pay's OpenAPI document (src/services/api/openapi.ts,",
    " * served at /api/v1/openapi.json) by packages/mcp/src/generate.ts. Do not edit.",
    " * After the API or src/curation.ts changes, regenerate:",
    " *",
    " *   npx vitest run packages/mcp/src/operations.drift.test.ts -u",
    " */",
    'import type { Operation } from "./generate.js";',
    "",
    `export const OPERATIONS: readonly Operation[] = ${JSON.stringify(operations, null, 2)};`,
    "",
  ].join("\n");
}
