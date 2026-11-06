import assert from "node:assert/strict";
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { after, before, test } from "node:test";
import { createApp, createLimiter, createRateLimiter } from "../src/app.ts";
import { createOutputParser, dockerArgs, WASM_END, WASM_START, type BuildEvent } from "../src/runner.ts";

test("los flags de Docker aíslan la compilación", () => {
  const args = dockerArgs("img", "name");
  assert.equal(args[args.indexOf("--network") + 1], "none");
  assert.equal(args[args.indexOf("--cap-drop") + 1], "ALL");
  assert.equal(args[args.indexOf("--memory") + 1], "1g");
  assert.ok(args.includes("--pids-limit"));
  assert.ok(!args.includes("-v") && !args.includes("--volume"), "no debe montar volúmenes");
});

test("el parser separa logs y WASM aunque lleguen partidos", () => {
  const events: BuildEvent[] = [];
  const parser = createOutputParser((event) => events.push(event));
  parser.push("Compiling foo\n<<<CONSTELA_");
  parser.push(`WASM_START>>>\nAGFz`);
  parser.push(`bQ==\n${WASM_END}\nfin`);
  assert.equal(parser.finish(), "AGFzbQ==");
  assert.deepEqual(events.map((event) => (event.type === "log" ? event.line : "")), ["Compiling foo", "fin"]);
  assert.ok(WASM_START.includes("START"));
});

test("el limitador encola y rechaza al llenarse", async () => {
  const limiter = createLimiter(1, 1);
  await limiter.tryAcquire();
  const queued = limiter.tryAcquire();
  assert.ok(queued);
  assert.equal(limiter.tryAcquire(), null);
  limiter.release();
  await queued;
});

test("el rate limit se reinicia después de un minuto", () => {
  let time = 0;
  const allow = createRateLimiter(1, () => time);
  assert.equal(allow("a"), true);
  assert.equal(allow("a"), false);
  assert.equal(allow("b"), true);
  time = 61_000;
  assert.equal(allow("a"), true);
});

let server: Server;
let base: string;

before(async () => {
  const app = createApp({
    runner: async (code, emit) => {
      emit({ type: "log", line: `len ${code.length}` });
      emit({ type: "done", ok: true, wasm: "AGFzbQ==" });
    },
    allowedOrigins: ["http://localhost:3000"],
    maxConcurrent: 1,
    maxQueued: 0,
    ratePerMinute: 100,
    trustProxy: false,
  });
  server = createServer((req, res) => void app(req, res));
  await new Promise<void>((resolve) => server.listen(0, resolve));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

after(() => server.close());

test("POST /compile transmite eventos NDJSON", async () => {
  const res = await fetch(`${base}/compile`, { method: "POST", body: JSON.stringify({ code: "abc" }) });
  assert.equal(res.status, 200);
  const events = (await res.text()).trim().split("\n").map((line) => JSON.parse(line));
  assert.deepEqual(events[0], { type: "log", line: "len 3" });
  assert.equal(events[1].ok, true);
});

test("rechaza orígenes, código vacío y código demasiado grande", async () => {
  const blocked = await fetch(`${base}/compile`, {
    method: "POST",
    headers: { Origin: "https://evil.example" },
    body: JSON.stringify({ code: "abc" }),
  });
  assert.equal(blocked.status, 403);

  const empty = await fetch(`${base}/compile`, { method: "POST", body: JSON.stringify({ code: " " }) });
  assert.equal(empty.status, 400);

  const large = await fetch(`${base}/compile`, { method: "POST", body: JSON.stringify({ code: "x".repeat(70 * 1024) }) });
  assert.equal(large.status, 413);
});
