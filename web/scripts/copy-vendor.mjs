// Sirve el SDK y el editor desde nuestro origen: no dependen de CDNs y quedan fijados a la versión instalada.
import { copyFileSync, cpSync, mkdirSync, rmSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

function packageRoot(name) {
  const main = require.resolve(name);
  const marker = join("node_modules", name);
  return main.slice(0, main.lastIndexOf(marker) + marker.length);
}

const target = join(here, "..", "public", "vendor");
mkdirSync(target, { recursive: true });
copyFileSync(join(packageRoot("@stellar/stellar-sdk"), "dist", "stellar-sdk.min.js"), join(target, "stellar-sdk.min.js"));

// Los nombres de los archivos de Monaco llevan hash: se borra la copia anterior para no acumular versiones viejas.
const monaco = join(target, "monaco");
rmSync(monaco, { recursive: true, force: true });
cpSync(join(packageRoot("monaco-editor"), "min"), monaco, { recursive: true });
