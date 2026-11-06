// Corre `cargo test` de cada plantilla dentro de la imagen aislada, sin red.
import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = new URL("../templates/contracts/", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const image = process.env.SANDBOX_IMAGE ?? "constela/soroban-sandbox:30.0.1";
const only = process.argv[2];
let failed = 0;

for (const id of readdirSync(root)) {
  if (only && id !== only) continue;
  const lib = readFileSync(join(root, id, "lib.rs"), "utf8");
  const testPath = join(root, id, "test.rs");
  const tests = existsSync(testPath) ? readFileSync(testPath, "utf8") : "";
  const source = `${lib}\n#[cfg(test)]\nmod test {\n${tests}\n}\n`;
  const result = spawnSync(
    "docker",
    ["run", "--rm", "-i", "--network", "none", "--cap-drop", "ALL", "--memory", "2g", image, "test"],
    { input: source, encoding: "utf8", maxBuffer: 32 * 1024 * 1024 },
  );
  const output = `${result.stdout ?? ""}${result.stderr ?? ""}`;
  const summary = output.match(/test result: .*/g)?.[0] ?? "sin resultado";
  console.log(`${result.status === 0 ? "OK  " : "FAIL"} ${id}: ${summary}`);
  if (result.status !== 0) {
    failed += 1;
    console.log(output.split("\n").slice(-40).join("\n"));
  }
}
process.exit(failed ? 1 : 0);
