import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";

export const WASM_START = "<<<CONSTELA_WASM_START>>>";
export const WASM_END = "<<<CONSTELA_WASM_END>>>";

export const LIMITS = {
  codeBytes: 64 * 1024,
  timeoutMs: 120_000,
  logBytes: 1024 * 1024,
};

export type BuildEvent =
  | { type: "log"; line: string }
  | { type: "done"; ok: true; wasm: string }
  | { type: "done"; ok: false; reason: "failed" | "timeout" | "unavailable" };

export type Runner = (code: string, emit: (event: BuildEvent) => void) => Promise<void>;

/** Flags de aislamiento: sin red, sin privilegios y con recursos acotados. No se monta ningún volumen. */
export function dockerArgs(image: string, name: string, mode: "build" | "test" = "build"): string[] {
  return [
    "run", "--rm", "-i",
    "--name", name,
    "--network", "none",
    "--cap-drop", "ALL",
    "--security-opt", "no-new-privileges",
    "--memory", "1g",
    "--memory-swap", "1g",
    "--cpus", "1",
    "--pids-limit", "256",
    "--ulimit", "fsize=268435456",
    image,
    mode,
  ];
}

/** Separa los logs del WASM aunque lleguen partidos en varios bloques. */
export function createOutputParser(emit: (event: BuildEvent) => void) {
  let buffer = "";
  let wasm = "";
  let collecting = false;
  let logged = 0;

  const line = (text: string) => {
    const clean = text.replace(/\r$/, "");
    if (clean === WASM_START) {
      collecting = true;
    } else if (clean === WASM_END) {
      collecting = false;
    } else if (collecting) {
      wasm += clean;
    } else if (clean.trim() && logged < LIMITS.logBytes) {
      logged += clean.length;
      emit({ type: "log", line: clean });
    }
  };

  return {
    push(chunk: string) {
      buffer += chunk;
      const parts = buffer.split("\n");
      buffer = parts.pop() ?? "";
      parts.forEach(line);
    },
    finish(): string {
      if (buffer) line(buffer);
      buffer = "";
      return wasm;
    },
  };
}

export function dockerRunner(image: string): Runner {
  return (code, emit) =>
    new Promise((resolve) => {
      const name = `constela-build-${randomUUID()}`;
      const child = spawn("docker", dockerArgs(image, name), { stdio: ["pipe", "pipe", "pipe"] });
      const parser = createOutputParser(emit);
      let timedOut = false;
      let settled = false;

      const finish = (event: BuildEvent) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        emit(event);
        resolve();
      };

      const timer = setTimeout(() => {
        timedOut = true;
        spawn("docker", ["kill", name], { stdio: "ignore" }).on("error", () => {});
      }, LIMITS.timeoutMs);

      child.stdout.setEncoding("utf8").on("data", (chunk: string) => parser.push(chunk));
      child.stderr.setEncoding("utf8").on("data", (chunk: string) => parser.push(chunk));
      child.stdin.on("error", () => {});
      child.stdin.end(code);

      child.on("error", () => finish({ type: "done", ok: false, reason: "unavailable" }));
      child.on("close", (exitCode) => {
        const wasm = parser.finish();
        if (timedOut) return finish({ type: "done", ok: false, reason: "timeout" });
        if (exitCode === 0 && wasm) return finish({ type: "done", ok: true, wasm });
        finish({ type: "done", ok: false, reason: "failed" });
      });
    });
}
