import { COMPILER_URL } from "./network";

export type CompileFailure = "unreachable" | "busy" | "rate_limited" | "too_large" | "failed" | "timeout" | "unavailable";
export type CompileResult = { ok: true; wasm: Uint8Array } | { ok: false; reason: CompileFailure };

function decodeBase64(value: string): Uint8Array {
  const binary = atob(value);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

const STATUS: Record<number, CompileFailure> = { 413: "too_large", 429: "rate_limited", 503: "busy" };

export async function compileContract(code: string, onLog: (line: string) => void): Promise<CompileResult> {
  let response: Response;
  try {
    response = await fetch(`${COMPILER_URL}/compile`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
  } catch {
    return { ok: false, reason: "unreachable" };
  }
  if (!response.ok || !response.body) return { ok: false, reason: STATUS[response.status] ?? "unavailable" };

  const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = "";
  let result: CompileResult = { ok: false, reason: "unavailable" };
  const handle = (line: string) => {
    if (!line.trim()) return;
    const event = JSON.parse(line);
    if (event.type === "log") onLog(event.line);
    else if (event.type === "done") result = event.ok ? { ok: true, wasm: decodeBase64(event.wasm) } : { ok: false, reason: event.reason };
  };
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += value;
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    lines.forEach(handle);
  }
  handle(buffer);
  return result;
}
