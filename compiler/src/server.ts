import { createServer } from "node:http";
import { createApp } from "./app.ts";
import { dockerRunner } from "./runner.ts";

const port = Number(process.env.PORT ?? 8787);
const image = process.env.SANDBOX_IMAGE ?? "constela/soroban-sandbox:30.0.1";
const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? "http://localhost:3000").split(",").map((origin) => origin.trim());

const app = createApp({
  runner: dockerRunner(image),
  allowedOrigins,
  maxConcurrent: Number(process.env.MAX_CONCURRENT ?? 4),
  maxQueued: Number(process.env.MAX_QUEUED ?? 20),
  ratePerMinute: Number(process.env.RATE_PER_MINUTE ?? 10),
  trustProxy: process.env.TRUST_PROXY === "true",
});

createServer((req, res) => {
  app(req, res).catch(() => {
    if (!res.headersSent) res.writeHead(500);
    res.end();
  });
}).listen(port, () => {
  console.log(`Compilador de Constela en http://localhost:${port} (imagen ${image})`);
});
