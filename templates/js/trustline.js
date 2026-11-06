// {{intro}}
// {{explain}}
// {{needs_account}}

// {{issuer_note}}
const issuer = await constela.newFundedAccount();
const asset = new StellarSdk.Asset("{{asset_code}}", issuer.publicKey());

const account = await constela.horizon.loadAccount(constela.publicKey());
const tx = new StellarSdk.TransactionBuilder(account, {
  fee: StellarSdk.BASE_FEE,
  networkPassphrase: constela.networkPassphrase,
})
  .addOperation(StellarSdk.Operation.changeTrust({ asset }))
  .setTimeout(60)
  .build();

const result = await constela.submit(tx);
console.log("{{done_label}}", asset.getCode());
console.log("{{view_label}}", constela.explorer.tx(result.hash));
