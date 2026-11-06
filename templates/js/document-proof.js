// {{intro}}
// {{privacy_warning}}
// {{salt_note}}
// {{needs_account}}

const DOCUMENT = "{{document_sample}}"; // {{document_note}}

const bytes = new TextEncoder().encode(DOCUMENT);
const salt = crypto.getRandomValues(new Uint8Array(16));
const toHex = (data) => Array.from(new Uint8Array(data), (b) => b.toString(16).padStart(2, "0")).join("");
const digest = await crypto.subtle.digest("SHA-256", new Uint8Array([...salt, ...bytes]));

const account = await constela.horizon.loadAccount(constela.publicKey());
const tx = new StellarSdk.TransactionBuilder(account, {
  fee: StellarSdk.BASE_FEE,
  networkPassphrase: constela.networkPassphrase,
})
  // {{memo_hash_note}}
  .addOperation(StellarSdk.Operation.payment({
    destination: constela.publicKey(),
    asset: StellarSdk.Asset.native(),
    amount: "0.0000001",
  }))
  .addMemo(StellarSdk.Memo.hash(toHex(digest)))
  .setTimeout(60)
  .build();

const result = await constela.submit(tx);
console.log("{{hash_label}}", toHex(digest));
console.log("{{salt_label}}", toHex(salt));
console.log("{{keep_salt}}");
console.log("{{view_label}}", constela.explorer.tx(result.hash));
