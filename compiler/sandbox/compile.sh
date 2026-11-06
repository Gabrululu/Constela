#!/bin/sh
# Recibe src/lib.rs por stdin. Modo "build" emite el WASM en base64 entre marcadores; modo "test" corre cargo test.
set -eu
mode="${1:-build}"
cat > src/lib.rs

if [ "$mode" = "test" ]; then
  exec cargo test --offline --color never 2>&1
fi

stellar contract build 2>&1
wasm="target/wasm32v1-none/release/constela_contract.wasm"
printf '\n<<<CONSTELA_WASM_START>>>\n'
base64 -w 0 "$wasm"
printf '\n<<<CONSTELA_WASM_END>>>\n'
