// Empaqueta templates/contracts y templates/js en un módulo TS para la web.
// Los contratos son archivos reales para poder probarlos con `cargo test`.
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const sources = {};

const contracts = join(root, "templates", "contracts");
for (const id of readdirSync(contracts)) {
  const file = join(contracts, id, "lib.rs");
  if (statSync(join(contracts, id)).isDirectory() && existsSync(file)) sources[id] = readFileSync(file, "utf8");
}

const scripts = join(root, "templates", "js");
for (const name of readdirSync(scripts)) {
  if (name.endsWith(".js")) sources[name.slice(0, -3)] = readFileSync(join(scripts, name), "utf8");
}

const body = `// Generado por scripts/build-templates.mjs. No editar a mano.\nexport const SOURCES: Record<string, string> = ${JSON.stringify(sources, null, 2)};\n`;
writeFileSync(join(root, "web", "src", "templates", "generated.ts"), body);
