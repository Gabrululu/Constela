"use client";

import { Droplets, ExternalLink, KeyRound, LogOut, RefreshCw, Trash2, Wallet as WalletIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { explorer, NETWORK, shortKey } from "@/lib/network";
import { connectExternalWallet, disconnectExternalWallet, fundWithFriendbot, practice } from "@/lib/wallet";
import { useIde } from "@/store/ide";
import { Button, CopyButton } from "./ui";
import { useReportError } from "./use-actions";

const GLOSSARY = ["testnet", "friendbot", "trustline", "contract"] as const;

export function AccountPanel() {
  const t = useTranslations("account");
  const locale = useLocale();
  const wallet = useIde((state) => state.wallet);
  const setWallet = useIde((state) => state.setWallet);
  const log = useIde((state) => state.log);
  const report = useReportError();
  const [balance, setBalance] = useState<string | null | undefined>(undefined);
  const [busy, setBusy] = useState<"create" | "fund" | "connect" | null>(null);

  const refresh = useCallback(async () => {
    if (!wallet) return;
    try {
      const response = await fetch(`${NETWORK.horizonUrl}/accounts/${wallet.publicKey}`);
      if (response.status === 404) return setBalance(null);
      const data = await response.json();
      const native = data.balances?.find((item: { asset_type: string }) => item.asset_type === "native");
      setBalance(native?.balance ?? "0");
    } catch (error) {
      report(error);
    }
  }, [wallet, report]);

  useEffect(() => {
    // La cuenta de práctica persistida solo es válida si su clave sigue en este navegador.
    if (wallet?.kind === "practice" && practice.publicKey() !== wallet.publicKey) setWallet(null);
  }, [wallet, setWallet]);

  useEffect(() => {
    if (!wallet) return setBalance(undefined);
    refresh();
    const timer = setInterval(refresh, 20_000);
    return () => clearInterval(timer);
  }, [wallet, refresh]);

  const fund = async (publicKey: string) => {
    setBusy("fund");
    try {
      await fundWithFriendbot(publicKey);
      log("success", t("funded"));
      await refresh();
    } catch (error) {
      report(error);
    } finally {
      setBusy(null);
    }
  };

  const createPractice = async () => {
    setBusy("create");
    try {
      const publicKey = practice.publicKey() ?? practice.create();
      await fundWithFriendbot(publicKey);
      setWallet({ kind: "practice", publicKey });
      log("success", t("created"));
    } catch (error) {
      report(error);
    } finally {
      setBusy(null);
    }
  };

  const connect = async () => {
    setBusy("connect");
    try {
      const publicKey = await connectExternalWallet();
      setWallet({ kind: "external", publicKey });
      log("success", t("connected"));
    } catch (error) {
      report(error);
    } finally {
      setBusy(null);
    }
  };

  const disconnect = async () => {
    if (wallet?.kind === "external") await disconnectExternalWallet();
    setWallet(null);
    log("system", t("disconnected"));
  };

  const forget = () => {
    if (!window.confirm(t("forgetConfirm"))) return;
    practice.forget();
    setWallet(null);
  };

  return (
    <div className="scrollbar-thin flex h-full flex-col gap-5 overflow-y-auto p-4">
      <h2 className="font-serif text-lg">{t("title")}</h2>

      {!wallet ? (
        <div className="flex flex-col gap-3">
          <p className="text-sm leading-relaxed text-muted">{t("intro")}</p>
          <Button variant="primary" disabled={busy !== null} onClick={createPractice}>
            <KeyRound aria-hidden strokeWidth={1.5} className="h-4 w-4" />
            {busy === "create" ? t("creating") : t("createPractice")}
          </Button>
          <Button disabled={busy !== null} onClick={connect}>
            <WalletIcon aria-hidden strokeWidth={1.5} className="h-4 w-4" />
            {t("connectWallet")}
          </Button>
          <p className="text-xs text-muted">{t("walletHint")}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <div>
            <p className="text-xs font-medium text-lilac">{wallet.kind === "practice" ? t("practiceLabel") : t("walletLabel")}</p>
            <p className="flex items-center gap-1 font-mono text-sm">
              {shortKey(wallet.publicKey)}
              <CopyButton value={wallet.publicKey} />
            </p>
          </div>
          <div>
            <p className="text-xs text-muted">{t("balance")}</p>
            <p className="font-serif text-3xl text-gold">
              {balance === undefined
                ? "…"
                : balance === null
                  ? t("unfunded")
                  : `${Number(balance).toLocaleString(locale, { maximumFractionDigits: 2 })} XLM`}
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <Button variant={balance === null ? "primary" : "secondary"} disabled={busy !== null} onClick={() => fund(wallet.publicKey)}>
              <Droplets aria-hidden strokeWidth={1.5} className="h-4 w-4" />
              {busy === "fund" ? t("funding") : t("fund")}
            </Button>
            <div className="flex gap-2">
              <Button className="flex-1" onClick={refresh} aria-label={t("refresh")} title={t("refresh")}>
                <RefreshCw aria-hidden strokeWidth={1.5} className="h-4 w-4" />
              </Button>
              <a
                href={explorer.account(wallet.publicKey)}
                target="_blank"
                rel="noreferrer noopener"
                aria-label={t("viewExplorer")}
                title={t("viewExplorer")}
                className="flex flex-1 items-center justify-center rounded-lg border border-line text-sm transition-colors hover:border-snow"
              >
                <ExternalLink aria-hidden strokeWidth={1.5} className="h-4 w-4" />
              </a>
              <Button className="flex-1" onClick={disconnect} aria-label={t("disconnect")} title={t("disconnect")}>
                <LogOut aria-hidden strokeWidth={1.5} className="h-4 w-4" />
              </Button>
            </div>
          </div>
          {wallet.kind === "practice" && (
            <div className="flex flex-col gap-1">
              <p className="text-xs text-muted">{t("practiceNote")}</p>
              <Button variant="ghost" className="!justify-start !px-0 text-xs" onClick={forget}>
                <Trash2 aria-hidden strokeWidth={1.5} className="h-3.5 w-3.5" />
                {t("forget")}
              </Button>
            </div>
          )}
        </div>
      )}

      <section className="mt-auto border-t border-line pt-4">
        <h3 className="text-xs font-semibold text-lilac">{t("learnTitle")}</h3>
        <dl className="mt-2 flex flex-col gap-2 text-xs">
          {GLOSSARY.map((key) => (
            <div key={key}>
              <dt className="font-medium">{t(`glossary.${key}.term`)}</dt>
              <dd className="leading-snug text-muted">{t(`glossary.${key}.def`)}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
