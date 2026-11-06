"use client";

import { Asset, type contract, type xdr } from "@stellar/stellar-sdk";
import { Upload, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { ArgError } from "@/lib/args";
import { explorer, NETWORK, shortKey } from "@/lib/network";
import {
  deployContract,
  invokeCall,
  loadContractSpec,
  readSpec,
  simulateCall,
  specFunctions,
  toScVals,
  type SpecArg,
  type SpecFunction,
} from "@/lib/soroban";
import { useIde } from "@/store/ide";
import { Button, CopyButton, Field, inputClass, TextInput } from "./ui";
import { useReportError, useSigner } from "./use-actions";

const NATIVE_TOKEN_ID = Asset.native().contractId(NETWORK.passphrase);
const CONSTRUCTOR = "__constructor";

export function ContractsTab() {
  const t = useTranslations("contracts");
  const [view, setView] = useState<"deploy" | "interact">("deploy");
  const activeContract = useIde((state) => state.activeContract);

  useEffect(() => {
    if (activeContract) setView("interact");
  }, [activeContract]);

  return (
    <div className="scrollbar-thin h-full overflow-y-auto">
      <div className="mx-auto flex max-w-2xl flex-col gap-5 p-5">
        <h2 className="font-serif text-2xl">{t("title")}</h2>
        <div className="flex gap-1 border-b border-line">
          {(["deploy", "interact"] as const).map((id) => (
            <button
              key={id}
              type="button"
              aria-current={view === id ? "true" : undefined}
              onClick={() => setView(id)}
              className={`border-b-2 px-3 py-2 text-sm ${view === id ? "border-gold text-gold" : "border-transparent text-muted hover:text-snow"}`}
            >
              {t(id === "deploy" ? "deployTab" : "interactTab")}
            </button>
          ))}
        </div>
        {view === "deploy" ? <DeployView /> : <InteractView />}
      </div>
    </div>
  );
}

function ArgInput({ arg, value, onChange, idPrefix }: { arg: SpecArg; value: string; onChange: (value: string) => void; idPrefix: string }) {
  const t = useTranslations("contracts");
  const wallet = useIde((state) => state.wallet);
  const id = `${idPrefix}-${arg.name}`;
  return (
    <Field label={arg.name} hint={arg.typeLabel} htmlFor={id}>
      {arg.kind === "vec" || arg.kind === "json" ? (
        <textarea id={id} rows={3} spellCheck={false} value={value} onChange={(event) => onChange(event.target.value)} className={`${inputClass} font-mono`} />
      ) : arg.kind === "bool" ? (
        <select id={id} value={value} onChange={(event) => onChange(event.target.value)} className={inputClass}>
          <option value="" />
          <option value="true">true</option>
          <option value="false">false</option>
        </select>
      ) : (
        <TextInput id={id} value={value} onChange={(event) => onChange(event.target.value)} className="font-mono" />
      )}
      {arg.kind === "address" && (
        <div className="mt-1 flex flex-wrap gap-2">
          {wallet && (
            <button type="button" onClick={() => onChange(wallet.publicKey)} className="text-xs text-ok underline-offset-2 hover:underline">
              {t("useMyAddress")}
            </button>
          )}
          {arg.name.toLowerCase().includes("token") && (
            <button type="button" onClick={() => onChange(NATIVE_TOKEN_ID)} className="text-xs text-ok underline-offset-2 hover:underline">
              {t("nativeToken")}
            </button>
          )}
        </div>
      )}
    </Field>
  );
}

function useArgErrorReporter() {
  const t = useTranslations("contracts");
  const log = useIde((state) => state.log);
  const report = useReportError();
  return (error: unknown, fn: SpecFunction) => {
    if (error instanceof ArgError) {
      const arg = fn.args.find((item) => item.kind === error.kind);
      log("error", t("invalidArg", { name: arg?.name ?? fn.name, type: arg?.typeLabel ?? error.kind }));
    } else {
      report(error);
    }
  };
}

function DeployView() {
  const t = useTranslations("contracts");
  const compiled = useIde((state) => state.compiled);
  const setCompiled = useIde((state) => state.setCompiled);
  const wallet = useIde((state) => state.wallet);
  const log = useIde((state) => state.log);
  const saveContract = useIde((state) => state.saveContract);
  const openContract = useIde((state) => state.openContract);
  const report = useReportError();
  const reportArg = useArgErrorReporter();
  const sign = useSigner();
  const [values, setValues] = useState<Record<string, string>>({});
  const [name, setName] = useState("");
  const [deploying, setDeploying] = useState(false);

  const parsed = useMemo(() => {
    if (!compiled) return null;
    try {
      const spec = readSpec(compiled.wasm);
      return { spec, ctor: specFunctions(spec).find((fn) => fn.name === CONSTRUCTOR) ?? null };
    } catch {
      return null;
    }
  }, [compiled]);

  useEffect(() => {
    setValues({});
    setName(compiled?.name ?? "");
  }, [compiled]);

  const upload = async (file: File | undefined) => {
    if (!file) return;
    const wasm = new Uint8Array(await file.arrayBuffer());
    try {
      readSpec(wasm);
      setCompiled({ wasm, name: file.name.replace(/\.wasm$/, "") });
    } catch {
      log("error", t("wasmInvalid"));
    }
  };

  const deploy = async () => {
    if (!compiled || !parsed || !wallet) return;
    let args: xdr.ScVal[] = [];
    try {
      if (parsed.ctor) args = toScVals(parsed.spec, parsed.ctor, values);
    } catch (error) {
      reportArg(error, parsed.ctor as SpecFunction);
      return;
    }
    setDeploying(true);
    try {
      const { contractId } = await deployContract({
        wasm: compiled.wasm,
        constructorArgs: args,
        publicKey: wallet.publicKey,
        sign,
        onStep: (step) => log("system", t(step === "upload" ? "stepUpload" : "stepCreate")),
      });
      log("success", `${t("deployed")} ${contractId}`);
      log("info", explorer.contract(contractId));
      saveContract({ id: contractId, name: name.trim() || shortKey(contractId), savedAt: new Date().toISOString() });
      openContract(contractId);
    } catch (error) {
      report(error);
    } finally {
      setDeploying(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {compiled && parsed ? (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-teal/50 bg-surface p-3">
          <div>
            <p className="text-xs font-medium text-ok">{t("compiledReady")}</p>
            <p className="text-sm">
              {compiled.name} · {(compiled.wasm.length / 1024).toFixed(1)} KB
            </p>
          </div>
          <Button variant="ghost" onClick={() => setCompiled(null)} aria-label={t("uploadWasm")}>
            <X aria-hidden className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <p className="text-sm text-muted">{t("noCompiled")}</p>
      )}

      <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-line p-4 text-sm transition-colors hover:border-snow">
        <Upload aria-hidden strokeWidth={1.5} className="h-4 w-4" />
        {t("uploadWasm")}
        <input type="file" accept=".wasm" className="sr-only" onChange={(event) => upload(event.target.files?.[0])} />
      </label>

      {parsed?.ctor && parsed.ctor.args.length > 0 && (
        <section className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-4">
          <div>
            <h3 className="font-medium">{t("constructorTitle")}</h3>
            <p className="text-xs text-muted">{t("constructorHint")}</p>
          </div>
          {parsed.ctor.args.map((arg) => (
            <ArgInput
              key={arg.name}
              idPrefix="ctor"
              arg={arg}
              value={values[arg.name] ?? ""}
              onChange={(value) => setValues((current) => ({ ...current, [arg.name]: value }))}
            />
          ))}
        </section>
      )}

      {compiled && (
        <Field label={t("contractName")} htmlFor="contract-name">
          <TextInput id="contract-name" value={name} onChange={(event) => setName(event.target.value)} />
        </Field>
      )}

      {compiled && !wallet && <p className="text-sm text-gold">{t("connectFirst")}</p>}
      <Button variant="primary" disabled={!compiled || !parsed || !wallet || deploying} onClick={deploy}>
        {deploying ? t("deploying") : t("deploy")}
      </Button>
    </div>
  );
}

function InteractView() {
  const t = useTranslations("contracts");
  const contracts = useIde((state) => state.contracts);
  const removeContract = useIde((state) => state.removeContract);
  const activeContract = useIde((state) => state.activeContract);
  const openContract = useIde((state) => state.openContract);
  const log = useIde((state) => state.log);
  const report = useReportError();
  const [contractId, setContractId] = useState(activeContract ?? "");
  const [loaded, setLoaded] = useState<{ id: string; spec: contract.Spec; functions: SpecFunction[] } | null>(null);
  const [busy, setBusy] = useState(false);

  const load = async (id: string) => {
    const value = id.trim();
    setContractId(value);
    if (!/^C[A-Z2-7]{55}$/.test(value)) {
      log("error", t("invalidId"));
      return;
    }
    setBusy(true);
    setLoaded(null);
    try {
      const spec = await loadContractSpec(value);
      const functions = specFunctions(spec).filter((fn) => fn.name !== CONSTRUCTOR);
      setLoaded({ id: value, spec, functions });
      log("success", t("loaded", { count: functions.length }));
    } catch (error) {
      report(error);
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (activeContract) {
      load(activeContract);
      openContract(null);
    }
    // Solo reacciona a un contrato recién desplegado.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeContract]);

  return (
    <div className="flex flex-col gap-4">
      <Field label={t("idLabel")} hint={t("idHint")} htmlFor="contract-id">
        <div className="flex gap-2">
          <TextInput id="contract-id" className="min-w-0 flex-1 font-mono" value={contractId} placeholder="C…" onChange={(event) => setContractId(event.target.value)} />
          <Button variant="primary" disabled={busy} onClick={() => load(contractId)}>
            {busy ? t("loading") : t("load")}
          </Button>
        </div>
      </Field>

      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold text-lilac">{contracts.length > 0 ? t("saved") : t("examples")}</p>
        <div className="flex flex-wrap gap-2">
          {contracts.map((item) => (
            <span key={item.id} className="flex items-center rounded-full border border-line pl-3 text-sm">
              <button type="button" onClick={() => load(item.id)} className="py-1 hover:text-gold">{item.name}</button>
              <button type="button" aria-label={t("saved")} onClick={() => removeContract(item.id)} className="px-2 py-1 text-muted hover:text-snow">
                <X aria-hidden className="h-3.5 w-3.5" />
              </button>
            </span>
          ))}
          {contracts.length === 0 && (
            <button type="button" onClick={() => load(NATIVE_TOKEN_ID)} className="rounded-full border border-line px-3 py-1 text-sm hover:border-snow">
              {t("nativeExample")}
            </button>
          )}
        </div>
      </div>

      {loaded && (
        <section className="flex flex-col gap-3">
          <div className="flex items-center gap-1">
            <h3 className="font-medium">{t("functions")}</h3>
            <span className="font-mono text-xs text-muted">{shortKey(loaded.id)}</span>
            <CopyButton value={loaded.id} />
          </div>
          {loaded.functions.map((fn) => (
            <FunctionCard key={fn.name} contractId={loaded.id} spec={loaded.spec} fn={fn} />
          ))}
        </section>
      )}
    </div>
  );
}

function FunctionCard({ contractId, spec, fn }: { contractId: string; spec: contract.Spec; fn: SpecFunction }) {
  const t = useTranslations("contracts");
  const wallet = useIde((state) => state.wallet);
  const log = useIde((state) => state.log);
  const reportArg = useArgErrorReporter();
  const sign = useSigner();
  const [values, setValues] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const query = async () => {
    setBusy(true);
    try {
      const { result, needsSignature } = await simulateCall({
        contractId,
        spec,
        fn,
        args: toScVals(spec, fn, values),
        publicKey: wallet?.publicKey ?? null,
      });
      log("success", `${fn.name} → ${t("result")} ${result}`);
      if (needsSignature) log("hint", t("needsSignature"));
    } catch (error) {
      reportArg(error, fn);
    } finally {
      setBusy(false);
    }
  };

  const execute = async () => {
    if (!wallet) return;
    setBusy(true);
    try {
      const { result, hash } = await invokeCall({
        contractId,
        spec,
        fn,
        args: toScVals(spec, fn, values),
        publicKey: wallet.publicKey,
        sign,
      });
      log("success", `${t("executed")} ${fn.name} → ${t("result")} ${result}`);
      log("info", explorer.tx(hash));
    } catch (error) {
      reportArg(error, fn);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-4">
      <div>
        <p className="font-mono font-medium text-gold">{fn.name}</p>
        {fn.doc && <p className="mt-1 text-sm text-muted">{fn.doc}</p>}
      </div>
      {fn.args.map((arg) => (
        <ArgInput
          key={arg.name}
          idPrefix={fn.name}
          arg={arg}
          value={values[arg.name] ?? ""}
          onChange={(value) => setValues((current) => ({ ...current, [arg.name]: value }))}
        />
      ))}
      <div className="flex flex-wrap gap-2">
        <Button disabled={busy} onClick={query} title={t("queryHint")}>{t("query")}</Button>
        <Button variant="primary" disabled={busy || !wallet} onClick={execute} title={wallet ? t("executeHint") : t("connectFirst")}>
          {t("execute")}
        </Button>
      </div>
    </div>
  );
}
