"use client";

import { Asset, BASE_FEE, Horizon, Memo, Operation, StrKey, TransactionBuilder } from "@stellar/stellar-sdk";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { explorer, NETWORK } from "@/lib/network";
import { useIde } from "@/store/ide";
import { Button, Field, TextInput } from "./ui";
import { useReportError, useSigner } from "./use-actions";

const OPS = ["payment", "trustline", "assetPayment", "issue", "pathPayment", "homeDomain"] as const;
type Op = (typeof OPS)[number];

const EMPTY = { destination: "", amount: "", memo: "", assetCode: "", assetIssuer: "", limit: "", destMin: "", homeDomain: "" };
type Form = typeof EMPTY;

const NEEDS: Record<Op, Array<keyof Form>> = {
  payment: ["destination", "amount"],
  trustline: ["assetCode", "assetIssuer"],
  assetPayment: ["assetCode", "assetIssuer", "destination", "amount"],
  issue: ["assetCode", "destination", "amount"],
  pathPayment: ["amount", "assetCode", "assetIssuer", "destMin", "destination"],
  homeDomain: ["homeDomain"],
};

function fieldError(key: keyof Form, value: string): boolean {
  if (key === "destination" || key === "assetIssuer") return !StrKey.isValidEd25519PublicKey(value.trim());
  if (key === "amount" || key === "destMin") return !/^\d+(\.\d{1,7})?$/.test(value.trim()) || Number(value) <= 0;
  if (key === "assetCode") return !/^[a-zA-Z0-9]{1,12}$/.test(value.trim());
  return !value.trim();
}

export function TransactionsTab() {
  const t = useTranslations("tx");
  const wallet = useIde((state) => state.wallet);
  const log = useIde((state) => state.log);
  const report = useReportError();
  const sign = useSigner();
  const [op, setOp] = useState<Op>("payment");
  const [form, setForm] = useState<Form>(EMPTY);
  const [touched, setTouched] = useState(false);
  const [sending, setSending] = useState(false);

  const invalid = NEEDS[op].filter((key) => fieldError(key, form[key]));
  const showError = (key: keyof Form) => touched && invalid.includes(key);

  const input = (key: keyof Form, labelKey: string, options: { hint?: string; placeholder?: string; mono?: boolean } = {}) => (
    <Field label={t(`fields.${labelKey}`)} hint={options.hint} htmlFor={`tx-${key}`}>
      <TextInput
        id={`tx-${key}`}
        value={form[key]}
        placeholder={options.placeholder}
        aria-invalid={showError(key)}
        className={`${options.mono ? "font-mono" : ""} ${showError(key) ? "!border-danger" : ""}`}
        onChange={(event) => setForm((current) => ({ ...current, [key]: event.target.value }))}
      />
    </Field>
  );

  const build = async () => {
    if (!wallet) throw new Error("constela_no_account");
    const server = new Horizon.Server(NETWORK.horizonUrl);
    const account = await server.loadAccount(wallet.publicKey);
    const builder = new TransactionBuilder(account, { fee: BASE_FEE, networkPassphrase: NETWORK.passphrase });
    const destination = form.destination.trim();
    const amount = form.amount.trim();
    const code = form.assetCode.trim().toUpperCase();
    const custom = () => new Asset(code, form.assetIssuer.trim());

    if (op === "payment") builder.addOperation(Operation.payment({ destination, asset: Asset.native(), amount }));
    if (op === "trustline") builder.addOperation(Operation.changeTrust({ asset: custom(), limit: form.limit.trim() || undefined }));
    if (op === "assetPayment") builder.addOperation(Operation.payment({ destination, asset: custom(), amount }));
    if (op === "issue") builder.addOperation(Operation.payment({ destination, asset: new Asset(code, wallet.publicKey), amount }));
    if (op === "pathPayment") {
      builder.addOperation(
        Operation.pathPaymentStrictSend({
          sendAsset: Asset.native(),
          sendAmount: amount,
          destination,
          destAsset: custom(),
          destMin: form.destMin.trim(),
          path: [],
        }),
      );
    }
    if (op === "homeDomain") builder.addOperation(Operation.setOptions({ homeDomain: form.homeDomain.trim() }));
    if ((op === "payment" || op === "assetPayment") && form.memo.trim()) builder.addMemo(Memo.text(form.memo.trim()));
    return { server, tx: builder.setTimeout(60).build() };
  };

  const validate = () => {
    setTouched(true);
    if (invalid.length) log("warning", t("invalid"));
    return invalid.length === 0;
  };

  const viewXdr = async () => {
    if (!validate()) return;
    try {
      const { tx } = await build();
      log("system", `${t("xdr")}\n${tx.toXDR()}`);
    } catch (error) {
      report(error);
    }
  };

  const send = async () => {
    if (!validate()) return;
    setSending(true);
    try {
      const { server, tx } = await build();
      const signed = await sign(tx.toXDR());
      const result = await server.submitTransaction(TransactionBuilder.fromXDR(signed, NETWORK.passphrase));
      log("success", `${t("sent")} ${explorer.tx(result.hash)}`);
    } catch (error) {
      report(error);
    } finally {
      setSending(false);
    }
  };

  const issuerHint = t("fields.destinationHint");

  return (
    <div className="scrollbar-thin h-full overflow-y-auto">
      <div className="mx-auto flex max-w-2xl flex-col gap-5 p-5">
        <div>
          <h2 className="font-serif text-2xl">{t("title")}</h2>
          <p className="text-sm text-muted">{t("lead")}</p>
        </div>

        <div role="radiogroup" aria-label={t("title")} className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {OPS.map((id) => (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={op === id}
              onClick={() => {
                setOp(id);
                setTouched(false);
              }}
              className={`rounded-lg border px-3 py-2.5 text-left text-sm font-medium transition-colors ${op === id ? "border-gold bg-raised text-gold" : "border-line hover:border-snow"}`}
            >
              {t(`ops.${id}.label`)}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-4 rounded-xl border border-line bg-surface p-4">
          <p className="text-sm text-sand">{t(`ops.${op}.desc`)}</p>
          {op === "payment" && (
            <>
              {input("destination", "destination", { hint: issuerHint, placeholder: "G…", mono: true })}
              {input("amount", "amount", { placeholder: "10" })}
              {input("memo", "memo", { hint: t("fields.memoHint") })}
            </>
          )}
          {op === "trustline" && (
            <>
              {input("assetCode", "assetCode", { placeholder: "USDC" })}
              {input("assetIssuer", "assetIssuer", { hint: issuerHint, placeholder: "G…", mono: true })}
              {input("limit", "limit")}
            </>
          )}
          {op === "assetPayment" && (
            <>
              {input("assetCode", "assetCode", { placeholder: "USDC" })}
              {input("assetIssuer", "assetIssuer", { hint: issuerHint, placeholder: "G…", mono: true })}
              {input("destination", "destination", { hint: issuerHint, placeholder: "G…", mono: true })}
              {input("amount", "amount", { placeholder: "10" })}
              {input("memo", "memo", { hint: t("fields.memoHint") })}
            </>
          )}
          {op === "issue" && (
            <>
              {input("assetCode", "assetCode", { placeholder: "MITOKEN" })}
              {input("destination", "destination", { hint: issuerHint, placeholder: "G…", mono: true })}
              {input("amount", "amount", { placeholder: "1000" })}
            </>
          )}
          {op === "pathPayment" && (
            <>
              {input("amount", "sendAmount", { placeholder: "10" })}
              {input("assetCode", "assetCode", { placeholder: "USDC" })}
              {input("assetIssuer", "assetIssuer", { hint: issuerHint, placeholder: "G…", mono: true })}
              {input("destMin", "destMin", { hint: t("fields.destMinHint"), placeholder: "1" })}
              {input("destination", "destination", { hint: issuerHint, placeholder: "G…", mono: true })}
            </>
          )}
          {op === "homeDomain" && input("homeDomain", "homeDomain", { placeholder: "ejemplo.org" })}
        </div>

        <div className="flex gap-2">
          <Button className="flex-1" disabled={!wallet} onClick={viewXdr}>{t("viewXdr")}</Button>
          <Button className="flex-[2]" variant="primary" disabled={!wallet || sending} onClick={send}>
            {sending ? t("sending") : wallet ? t("send") : t("connectFirst")}
          </Button>
        </div>
      </div>
    </div>
  );
}
