// {{intro}}
// {{needs_account}}

const AMOUNT = "10"; // {{amount_note}}

// {{destination_note}}
const destination = await constela.newFundedAccount();
console.log("{{destination_label}}", destination.publicKey());

const source = await constela.horizon.loadAccount(constela.publicKey());
const tx = new StellarSdk.TransactionBuilder(source, {
  fee: StellarSdk.BASE_FEE,
  networkPassphrase: constela.networkPassphrase,
})
  .addOperation(
    StellarSdk.Operation.payment({
      destination: destination.publicKey(),
      asset: StellarSdk.Asset.native(),
      amount: AMOUNT,
    }),
  )
  .setTimeout(60)
  .build();

// {{submit_note}}
const result = await constela.submit(tx);
console.log("{{sent_label}}", AMOUNT, "XLM");
console.log("{{view_label}}", constela.explorer.tx(result.hash));
