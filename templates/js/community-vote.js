// {{intro}}
// {{limits}}
// {{needs_account}}

const OPTIONS = ["{{option0}}", "{{option1}}", "{{option2}}"];
const MY_CHOICE = 1; // {{choice_note}}

const account = await constela.horizon.loadAccount(constela.publicKey());
const tx = new StellarSdk.TransactionBuilder(account, {
  fee: StellarSdk.BASE_FEE,
  networkPassphrase: constela.networkPassphrase,
})
  .addOperation(StellarSdk.Operation.manageData({ name: "community_vote", value: OPTIONS[MY_CHOICE] }))
  .setTimeout(60)
  .build();

const result = await constela.submit(tx);
console.log("{{voted_label}}", OPTIONS[MY_CHOICE]);

// {{read_note}}
const updated = await constela.horizon.loadAccount(constela.publicKey());
const raw = Uint8Array.from(atob(updated.data_attr.community_vote), (char) => char.charCodeAt(0));
const stored = new TextDecoder().decode(raw);
console.log("{{stored_label}}", stored);
console.log("{{view_label}}", constela.explorer.tx(result.hash));
