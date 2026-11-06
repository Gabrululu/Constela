// {{intro}}
// {{honest_note}}
// {{needs_account}}

const REMITTANCE = {
  amount: "25", // {{amount_note}}
  memo: "{{memo}}", // {{memo_note}}
};

// {{family_note}}
const family = await constela.newFundedAccount();
console.log("{{family_label}}", family.publicKey());

const sender = await constela.horizon.loadAccount(constela.publicKey());
const tx = new StellarSdk.TransactionBuilder(sender, {
  fee: StellarSdk.BASE_FEE,
  networkPassphrase: constela.networkPassphrase,
})
  .addOperation(
    StellarSdk.Operation.payment({
      destination: family.publicKey(),
      asset: StellarSdk.Asset.native(),
      amount: REMITTANCE.amount,
    }),
  )
  .addMemo(StellarSdk.Memo.text(REMITTANCE.memo))
  .setTimeout(60)
  .build();

const started = Date.now();
const result = await constela.submit(tx);
const seconds = ((Date.now() - started) / 1000).toFixed(1);

console.log("{{sent_label}}", REMITTANCE.amount, "XLM");
console.log("{{time_label}}", seconds, "s");
console.log("{{fee_label}}", Number(result.fee_charged) / 10_000_000, "XLM");
console.log("{{view_label}}", constela.explorer.tx(result.hash));
