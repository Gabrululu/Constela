"use client";

import { ExternalLink } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState, type FormEvent } from "react";
import { explorer, NETWORK, shortKey } from "@/lib/network";
import { useIde } from "@/store/ide";
import { Button, TextInput } from "./ui";
import { useReportError } from "./use-actions";

type Balance = { asset_type: string; asset_code?: string; balance: string };
type TxRecord = {
  hash: string;
  ledger: number;
  created_at: string;
  operation_count: number;
  successful: boolean;
  fee_charged: string;
  memo?: string;
};
type AccountView = { id: string; balances: Balance[]; recent: TxRecord[] };

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${NETWORK.horizonUrl}${path}`);
  if (!response.ok) throw new Error(`Not Found ${response.status}`);
  return response.json();
}

export function ExplorerTab() {
  const t = useTranslations("explorer");
  const locale = useLocale();
  const wallet = useIde((state) => state.wallet);
  const report = useReportError();
  const [mode, setMode] = useState<"account" | "transaction">("account");
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [account, setAccount] = useState<AccountView | null>(null);
  const [tx, setTx] = useState<TxRecord | null>(null);

  const number = (value: string) => Number(value).toLocaleString(locale, { maximumFractionDigits: 7 });
  const date = (value: string) => new Date(value).toLocaleString(locale);

  const searchAccount = async (id: string) => {
    setBusy(true);
    setAccount(null);
    try {
      const safe = encodeURIComponent(id);
      const [info, txs] = await Promise.all([
        getJson<{ id: string; balances: Balance[] }>(`/accounts/${safe}`),
        getJson<{ _embedded: { records: TxRecord[] } }>(`/accounts/${safe}/transactions?limit=10&order=desc`),
      ]);
      setAccount({ id: info.id, balances: info.balances, recent: txs._embedded.records });
    } catch (error) {
      report(error);
    } finally {
      setBusy(false);
    }
  };

  const searchTx = async (hash: string) => {
    setBusy(true);
    setTx(null);
    try {
      setTx(await getJson<TxRecord>(`/transactions/${encodeURIComponent(hash)}`));
    } catch (error) {
      report(error);
    } finally {
      setBusy(false);
    }
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const value = query.trim();
    if (!value) return;
    if (mode === "account") searchAccount(value);
    else searchTx(value);
  };

  const openTx = (hash: string) => {
    setMode("transaction");
    setQuery(hash);
    searchTx(hash);
  };

  return (
    <div className="scrollbar-thin h-full overflow-y-auto">
      <div className="mx-auto flex max-w-3xl flex-col gap-5 p-5">
        <h2 className="font-serif text-2xl">{t("title")}</h2>

        <div className="flex gap-1 border-b border-line">
          {(["account", "transaction"] as const).map((id) => (
            <button
              key={id}
              type="button"
              aria-current={mode === id ? "true" : undefined}
              onClick={() => {
                setMode(id);
                setQuery("");
              }}
              className={`border-b-2 px-3 py-2 text-sm ${mode === id ? "border-gold text-gold" : "border-transparent text-muted hover:text-snow"}`}
            >
              {t(id)}
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="flex flex-wrap gap-2">
          <TextInput
            aria-label={t(mode)}
            className="min-w-0 flex-1 basis-64 font-mono"
            value={query}
            placeholder={t(mode === "account" ? "accountPlaceholder" : "txPlaceholder")}
            onChange={(event) => setQuery(event.target.value)}
          />
          <Button type="submit" variant="primary" disabled={busy}>{busy ? t("searching") : t("search")}</Button>
          {mode === "account" && wallet && (
            <Button
              onClick={() => {
                setQuery(wallet.publicKey);
                searchAccount(wallet.publicKey);
              }}
            >
              {t("useMine")}
            </Button>
          )}
        </form>

        {mode === "account" && account && (
          <div className="flex flex-col gap-4">
            <section className="rounded-xl border border-line bg-surface p-4">
              <p className="break-all font-mono text-xs text-muted">{account.id}</p>
              <h3 className="mt-3 text-xs font-semibold text-lilac">{t("balances")}</h3>
              <ul className="mt-1">
                {account.balances.map((balance) => (
                  <li key={`${balance.asset_type}-${balance.asset_code ?? "xlm"}`} className="flex justify-between gap-4 py-1">
                    <span>{balance.asset_code ?? "XLM"}</span>
                    <span className="font-mono">{number(balance.balance)}</span>
                  </li>
                ))}
              </ul>
              <ExpertLink href={explorer.account(account.id)} label={t("openExpert")} />
            </section>

            <section className="rounded-xl border border-line bg-surface p-4">
              <h3 className="text-xs font-semibold text-lilac">{t("recent")}</h3>
              {account.recent.length === 0 ? (
                <p className="mt-2 text-sm text-muted">{t("noResults")}</p>
              ) : (
                <div className="mt-2 overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="text-xs text-muted">
                      <tr>
                        <th className="py-1 pr-3 font-medium">{t("hash")}</th>
                        <th className="py-1 pr-3 font-medium">{t("ops")}</th>
                        <th className="py-1 pr-3 font-medium">{t("date")}</th>
                        <th className="py-1 font-medium">{t("status")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {account.recent.map((record) => (
                        <tr key={record.hash} className="border-t border-line">
                          <td className="py-1.5 pr-3">
                            <button type="button" onClick={() => openTx(record.hash)} className="font-mono text-ok underline-offset-2 hover:underline">
                              {shortKey(record.hash)}
                            </button>
                          </td>
                          <td className="py-1.5 pr-3">{record.operation_count}</td>
                          <td className="whitespace-nowrap py-1.5 pr-3 text-muted">{date(record.created_at)}</td>
                          <td className={`py-1.5 ${record.successful ? "text-ok" : "text-danger"}`}>{record.successful ? t("ok") : t("failed")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        )}

        {mode === "transaction" && tx && (
          <section className="rounded-xl border border-line bg-surface p-4">
            <p className={`text-sm font-semibold ${tx.successful ? "text-ok" : "text-danger"}`}>{tx.successful ? t("ok") : t("failed")}</p>
            <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
              <dt className="text-muted">{t("hash")}</dt>
              <dd className="break-all font-mono text-xs">{tx.hash}</dd>
              <dt className="text-muted">{t("ledger")}</dt>
              <dd>{tx.ledger}</dd>
              <dt className="text-muted">{t("date")}</dt>
              <dd>{date(tx.created_at)}</dd>
              <dt className="text-muted">{t("fee")}</dt>
              <dd>{number(String(Number(tx.fee_charged) / 10_000_000))} XLM</dd>
              <dt className="text-muted">{t("ops")}</dt>
              <dd>{tx.operation_count}</dd>
              {tx.memo && (
                <>
                  <dt className="text-muted">{t("memo")}</dt>
                  <dd className="break-all">{tx.memo}</dd>
                </>
              )}
            </dl>
            <ExpertLink href={explorer.tx(tx.hash)} label={t("openExpert")} />
          </section>
        )}
      </div>
    </div>
  );
}

function ExpertLink({ href, label }: { href: string; label: string }) {
  return (
    <a href={href} target="_blank" rel="noreferrer noopener" className="mt-3 inline-flex items-center gap-1.5 text-sm text-ok underline-offset-2 hover:underline">
      {label}
      <ExternalLink aria-hidden strokeWidth={1.5} className="h-3.5 w-3.5" />
    </a>
  );
}
