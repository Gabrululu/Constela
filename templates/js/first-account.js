// {{intro}}
// {{safe}}

const pair = StellarSdk.Keypair.random();
console.log("{{public_label}}", pair.publicKey());
console.log("{{secret_warning}}");

console.log("{{funding}}");
await constela.fund(pair.publicKey());

const account = await constela.horizon.loadAccount(pair.publicKey());
const xlm = account.balances.find((balance) => balance.asset_type === "native");
console.log("{{balance_label}}", xlm.balance, "XLM");
console.log("{{view_label}}", constela.explorer.account(pair.publicKey()));
