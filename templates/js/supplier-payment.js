// {{intro}}
// {{demo_note}}
// {{runs_alone}}

const AMOUNT = "150";

const issuer = await constela.newFundedAccount();
const buyer = await constela.newFundedAccount();
const supplier = await constela.newFundedAccount();
const stablecoin = new StellarSdk.Asset("USDDEMO", issuer.publicKey());
console.log("{{accounts_ready}}");

const server = constela.horizon;
const options = { fee: StellarSdk.BASE_FEE, networkPassphrase: constela.networkPassphrase };

// {{step_trust}}
for (const pair of [buyer, supplier]) {
  const account = await server.loadAccount(pair.publicKey());
  const tx = new StellarSdk.TransactionBuilder(account, options)
    .addOperation(StellarSdk.Operation.changeTrust({ asset: stablecoin }))
    .setTimeout(60)
    .build();
  tx.sign(pair);
  await server.submitTransaction(tx);
}
console.log("{{trust_done}}");

// {{step_issue}}
const issuerAccount = await server.loadAccount(issuer.publicKey());
const issueTx = new StellarSdk.TransactionBuilder(issuerAccount, options)
  .addOperation(
    StellarSdk.Operation.payment({ destination: buyer.publicKey(), asset: stablecoin, amount: "1000" }),
  )
  .setTimeout(60)
  .build();
issueTx.sign(issuer);
await server.submitTransaction(issueTx);

// {{step_pay}}
const buyerAccount = await server.loadAccount(buyer.publicKey());
const payTx = new StellarSdk.TransactionBuilder(buyerAccount, options)
  .addOperation(
    StellarSdk.Operation.payment({ destination: supplier.publicKey(), asset: stablecoin, amount: AMOUNT }),
  )
  .addMemo(StellarSdk.Memo.text("{{memo}}"))
  .setTimeout(60)
  .build();
payTx.sign(buyer);
const result = await server.submitTransaction(payTx);

console.log("{{paid_label}}", AMOUNT, "USDDEMO");
console.log("{{view_label}}", constela.explorer.tx(result.hash));
