/**
 * One call to Perly Pay's API, the way the Node SDK makes it: the key as a
 * Bearer token, JSON in and out, a fresh Idempotency-Key on every POST (the
 * same one across its retries), and up to two retries with backoff on a
 * dropped connection, 429 or 5xx (honouring Retry-After). Plain fetch.
 */
import type { Config } from "./config.js";

export const MCP_VERSION = "0.1.0";

export interface ApiError {
  type: string;
  code: string;
  message: string;
  param?: string;
}

export type ApiResult =
  | { ok: true; status: number; data: unknown }
  | { ok: false; status: number; error: ApiError; requestId?: string };

export interface ApiDeps {
  fetch: typeof fetch;
  sleep?: (ms: number) => Promise<void>;
  /** Idempotency keys (tests pass a fixed one). */
  uuid?: () => string;
  timeoutMs?: number;
  maxRetries?: number;
}

export type Query = Record<string, unknown>;

function retryAfterMs(header: string | null, attempt: number): number {
  const seconds = header !== null ? Number(header) : NaN;
  if (Number.isFinite(seconds) && seconds >= 0) return Math.min(seconds * 1000, 30_000);
  return 500 * 2 ** attempt;
}

export async function callApi(
  config: Config,
  deps: ApiDeps,
  method: "GET" | "POST" | "DELETE",
  path: string,
  query?: Query,
  body?: Record<string, unknown>,
): Promise<ApiResult> {
  const url = new URL(config.apiUrl + path);
  for (const [k, v] of Object.entries(query ?? {})) {
    if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
  }
  const headers: Record<string, string> = {
    Accept: "application/json",
    Authorization: `Bearer ${config.secretKey ?? ""}`,
    "Perly-Client": `mcp/${MCP_VERSION}`,
  };
  let payload: string | undefined;
  if (method === "POST") {
    headers["Content-Type"] = "application/json";
    headers["Idempotency-Key"] = (deps.uuid ?? (() => crypto.randomUUID()))();
    payload = JSON.stringify(body ?? {});
  }
  const retries = deps.maxRetries ?? 2;
  const sleep = deps.sleep ?? ((ms: number) => new Promise<void>((r) => setTimeout(r, ms)));

  for (let attempt = 0; ; attempt++) {
    let response: Response;
    try {
      response = await deps.fetch(url.toString(), {
        method,
        headers,
        body: payload,
        signal: AbortSignal.timeout(deps.timeoutMs ?? 30_000),
      });
    } catch (error) {
      if (attempt < retries) {
        await sleep(retryAfterMs(null, attempt));
        continue;
      }
      const timedOut = (error as Error)?.name === "TimeoutError";
      return {
        ok: false,
        status: 0,
        error: {
          type: "connection_error",
          code: timedOut ? "timeout" : "connection_failed",
          message: `Could not reach Perly Pay at ${config.siteUrl}${timedOut ? " (no answer in time)" : ""}.`,
        },
      };
    }

    const text = await response.text();
    let json: unknown = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      json = null;
    }
    if (response.ok) return { ok: true, status: response.status, data: json };

    const error = (json as { error?: Partial<ApiError> } | null)?.error;
    const inProgress = response.status === 409 && error?.code === "idempotency_in_progress";
    const retriable = response.status === 429 || response.status >= 500 || inProgress;
    if (retriable && attempt < retries) {
      await sleep(retryAfterMs(response.headers.get("retry-after"), attempt));
      continue;
    }
    return {
      ok: false,
      status: response.status,
      error: {
        type: error?.type ?? "api_error",
        code: error?.code ?? `http_${response.status}`,
        message: error?.message ?? `Perly Pay answered ${response.status}.`,
        ...(error?.param ? { param: error.param } : {}),
      },
      ...(response.headers.get("perly-request-id") ? { requestId: response.headers.get("perly-request-id")! } : {}),
    };
  }
}
