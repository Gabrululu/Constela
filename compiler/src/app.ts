import type { IncomingMessage, ServerResponse } from "node:http";
import { LIMITS, type BuildEvent, type Runner } from "./runner.ts";

export type AppOptions = {
  runner: Runner;
  allowedOrigins: string[];
  maxConcurrent: number;
  maxQueued: number;
  ratePerMinute: number;
  trustProxy: boolean;
  now?: () => number;
};

/** Cola FIFO con un máximo de builds simultáneos. */
export function createLimiter(maxConcurrent: number, maxQueued: number) {
  let active = 0;
  const waiting: Array<() => void> = [];
  return {
    tryAcquire(): Promise<void> | null {
      if (active < maxConcurrent) {
        active += 1;
        return Promise.resolve();
      }
      if (waiting.length >= maxQueued) return null;
      return new Promise((resolve) => waiting.push(resolve));
    },
    release() {
      const next = waiting.shift();
      if (next) next();
      else active -= 1;
    },
  };
}

export function createRateLimiter(perMinute: number, now: () => number) {
  const hits = new Map<string, number[]>();
  return (key: string): boolean => {
    const cutoff = now() - 60_000;
    const recent = (hits.get(key) ?? []).filter((time) => time > cutoff);
    if (recent.length >= perMinute) {
      hits.set(key, recent);
      return false;
    }
    recent.push(now());
    hits.set(key, recent);
    return true;
  };
}

function readBody(req: IncomingMessage, maxBytes: number): Promise<string | null> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let size = 0;
    let tooLarge = false;
    req.on("data", (chunk: Buffer) => {
      size += chunk.length;
      if (size > maxBytes) tooLarge = true;
      else chunks.push(chunk);
    });
    req.on("end", () => resolve(tooLarge ? null : Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

function sendJson(res: ServerResponse, status: number, body: object) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(body));
}

export function createApp(options: AppOptions) {
  const limiter = createLimiter(options.maxConcurrent, options.maxQueued);
  const allowRate = createRateLimiter(options.ratePerMinute, options.now ?? Date.now);

  return async (req: IncomingMessage, res: ServerResponse) => {
    const origin = req.headers.origin;
    if (origin && options.allowedOrigins.includes(origin)) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Vary", "Origin");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type");
      res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
    }
    if (req.method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return;
    }
    if (req.method === "GET" && req.url === "/health") return sendJson(res, 200, { ok: true });
    if (req.method !== "POST" || req.url !== "/compile") return sendJson(res, 404, { error: "not_found" });
    if (origin && !options.allowedOrigins.includes(origin)) return sendJson(res, 403, { error: "origin_not_allowed" });

    const forwarded = options.trustProxy ? String(req.headers["x-forwarded-for"] ?? "").split(",")[0].trim() : "";
    const client = forwarded || req.socket.remoteAddress || "unknown";
    if (!allowRate(client)) return sendJson(res, 429, { error: "rate_limited" });

    const raw = await readBody(req, LIMITS.codeBytes * 2);
    if (raw === null) return sendJson(res, 413, { error: "code_too_large" });

    let code: unknown;
    try {
      code = JSON.parse(raw).code;
    } catch {
      return sendJson(res, 400, { error: "invalid_json" });
    }
    if (typeof code !== "string" || !code.trim()) return sendJson(res, 400, { error: "missing_code" });
    if (Buffer.byteLength(code) > LIMITS.codeBytes) return sendJson(res, 413, { error: "code_too_large" });

    const slot = limiter.tryAcquire();
    if (!slot) return sendJson(res, 503, { error: "busy" });
    await slot;

    res.writeHead(200, { "Content-Type": "application/x-ndjson", "Cache-Control": "no-store" });
    const emit = (event: BuildEvent) => res.write(`${JSON.stringify(event)}\n`);
    try {
      await options.runner(code, emit);
    } catch {
      emit({ type: "done", ok: false, reason: "unavailable" });
    } finally {
      limiter.release();
      res.end();
    }
  };
}
