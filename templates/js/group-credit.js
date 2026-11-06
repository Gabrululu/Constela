// {{intro}}
// {{atomic_note}}
// {{needs_account}}

const AMOUNT_PER_PERSON = "5"; // {{amount_note}}
const GROUP = ["{{name0}}", "{{name1}}", "{{name2}}"];

// {{members_note}}
const members = GROUP.map((name) => ({ name, pair: StellarSdk.Keypair.random() }));

const coordinator = await constela.horizon.loadAccount(constela.publicKey());
const builder = new StellarSdk.TransactionBuilder(coordinator, {
  fee: StellarSdk.BASE_FEE,
  networkPassphrase: constela.networkPassphrase,
});

for (const member of members) {
  builder.addOperation(
    StellarSdk.Operation.createAccount({
      destination: member.pair.publicKey(),
      startingBalance: AMOUNT_PER_PERSON,
    }),
  );
}

const result = await constela.submit(builder.addMemo(StellarSdk.Memo.text("{{memo}}")).setTimeout(60).build());

for (const member of members) {
  console.log(member.name, "+" + AMOUNT_PER_PERSON, "XLM");
}
console.log("{{view_label}}", constela.explorer.tx(result.hash));
