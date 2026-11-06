import { NETWORK } from "./network";

/** Solo se puede conectar a testnet: la CSP bloquea mainnet y cualquier otro destino, también para código del usuario. */
export function sandboxCsp(): string {
  const connect = [NETWORK.horizonUrl, NETWORK.rpcUrl, NETWORK.friendbotUrl].join(" ");
  return `default-src 'none'; script-src 'unsafe-inline'; connect-src ${connect}`;
}

let sdkSource: Promise<string> | null = null;

/** El SDK se descarga una vez desde nuestro origen y va dentro del documento: el iframe no carga nada externo. */
export function loadSdkSource(): Promise<string> {
  sdkSource ??= fetch("/vendor/stellar-sdk.min.js").then((response) => {
    if (!response.ok) throw new Error(`sdk_unavailable ${response.status}`);
    return response.text();
  });
  sdkSource.catch(() => {
    sdkSource = null;
  });
  return sdkSource;
}

function escapeForScript(code: string): string {
  return code.replace(/<\/(script)/gi, "<\\/$1").replace(/<!--/g, "<\\!--");
}

const RUNTIME = `
const post = (message) => parent.postMessage(message, "*");
const format = (value) => {
  if (typeof value === "string") return value;
  try { return JSON.stringify(value, (_, v) => (typeof v === "bigint" ? v.toString() : v), 2); } catch { return String(value); }
};
for (const [method, level] of [["log", "info"], ["info", "info"], ["warn", "warning"], ["error", "error"]]) {
  console[method] = (...args) => post({ type: "log", level, message: args.map(format).join(" ") });
}
window.addEventListener("error", (event) => post({ type: "failed", message: event.message }));
window.addEventListener("unhandledrejection", (event) => post({ type: "failed", message: describe(event.reason) }));

function describe(error) {
  const codes = error && error.response && error.response.data && error.response.data.extras && error.response.data.extras.result_codes;
  if (codes) return JSON.stringify(codes);
  return (error && error.message) || String(error);
}

let nextId = 0;
const pending = new Map();
window.addEventListener("message", (event) => {
  if (event.source !== parent || !event.data || event.data.type !== "sign-result") return;
  const request = pending.get(event.data.id);
  if (!request) return;
  pending.delete(event.data.id);
  if (event.data.error) request.reject(new Error(event.data.error));
  else request.resolve(event.data.xdr);
});

const config = window.__CONSTELA__;
const horizon = new StellarSdk.Horizon.Server(config.horizonUrl);

async function fund(publicKey) {
  const response = await fetch(config.friendbotUrl + "?addr=" + encodeURIComponent(publicKey));
  if (!response.ok) throw new Error("friendbot_failed " + response.status);
}

window.constela = Object.freeze({
  horizon,
  networkPassphrase: config.passphrase,
  explorer: Object.freeze({
    account: (id) => config.explorerUrl + "/account/" + id,
    tx: (hash) => config.explorerUrl + "/tx/" + hash,
  }),
  publicKey() {
    if (!config.publicKey) throw new Error("constela_no_account");
    return config.publicKey;
  },
  fund,
  async newFundedAccount() {
    const pair = StellarSdk.Keypair.random();
    await fund(pair.publicKey());
    return pair;
  },
  sign(transaction) {
    return new Promise((resolve, reject) => {
      const id = ++nextId;
      pending.set(id, { resolve, reject });
      post({ type: "sign", id, xdr: transaction.toXDR() });
    });
  },
  async submit(transaction) {
    const signed = await this.sign(transaction);
    return horizon.submitTransaction(StellarSdk.TransactionBuilder.fromXDR(signed, config.passphrase));
  },
});
window.__describeError = describe;
`;

export type SandboxConfig = { sdkSource: string; publicKey: string | null };

/** Documento para un iframe sandbox="allow-scripts": origen opaco, sin acceso a localStorage ni a la clave de práctica. */
export function buildSandboxDocument(code: string, config: SandboxConfig): string {
  const payload = JSON.stringify({
    publicKey: config.publicKey,
    passphrase: NETWORK.passphrase,
    horizonUrl: NETWORK.horizonUrl,
    friendbotUrl: NETWORK.friendbotUrl,
    explorerUrl: NETWORK.explorerUrl,
  });
  return `<!doctype html><html><head><meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="${sandboxCsp()}">
</head><body>
<script>${escapeForScript(config.sdkSource)}</script>
<script>window.__CONSTELA__ = ${escapeForScript(payload)};${RUNTIME}</script>
<script>
(async () => {
  try {
${escapeForScript(code)}
    parent.postMessage({ type: "done" }, "*");
  } catch (error) {
    parent.postMessage({ type: "failed", message: window.__describeError(error) }, "*");
  }
})();
</script>
</body></html>`;
}
