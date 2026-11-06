"use client";

import { ChevronDown, ChevronUp, Code2, FileCode, Landmark, Search, Send, Terminal, UserRound } from "lucide-react";
import dynamic from "next/dynamic";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { ConstelaMark } from "@/components/brand";
import { LocaleSwitch } from "@/components/locale-switch";
import { Link } from "@/i18n/navigation";
import { COUNTRIES, defaultCountry, type AppLocale, type CountryId } from "@/lib/countries";
import { useIde, type IdeTab } from "@/store/ide";
import { AccountPanel } from "./account-panel";
import { ConsolePanel } from "./console-panel";
import { TemplatesPanel } from "./templates-panel";

const loading = () => <div className="h-full animate-pulse bg-surface" />;
const EditorTab = dynamic(() => import("./editor-tab").then((mod) => mod.EditorTab), { ssr: false, loading });
const TransactionsTab = dynamic(() => import("./transactions-tab").then((mod) => mod.TransactionsTab), { ssr: false, loading });
const ContractsTab = dynamic(() => import("./contracts-tab").then((mod) => mod.ContractsTab), { ssr: false, loading });
const ExplorerTab = dynamic(() => import("./explorer-tab").then((mod) => mod.ExplorerTab), { ssr: false, loading });

const TABS: Array<[IdeTab, typeof Code2]> = [
  ["editor", Code2],
  ["transactions", Send],
  ["contracts", FileCode],
  ["explorer", Search],
];

type MobilePanel = "templates" | "code" | "account" | "console";
const MOBILE: Array<[MobilePanel, typeof Code2]> = [
  ["templates", Landmark],
  ["code", Code2],
  ["account", UserRound],
  ["console", Terminal],
];

export function IdeShell() {
  const t = useTranslations("ide");
  const consoleT = useTranslations("console");
  const locale = useLocale() as AppLocale;
  const tab = useIde((state) => state.tab);
  const setTab = useIde((state) => state.setTab);
  const country = useIde((state) => state.country);
  const setCountry = useIde((state) => state.setCountry);
  const [hydrated, setHydrated] = useState(false);
  const [mobile, setMobile] = useState<MobilePanel>("code");
  const [consoleOpen, setConsoleOpen] = useState(true);

  useEffect(() => {
    Promise.resolve(useIde.persist.rehydrate()).finally(() => setHydrated(true));
  }, []);

  const activeCountry = country ?? defaultCountry(locale);
  const hidden = (panel: MobilePanel) => (mobile === panel ? "flex" : "hidden lg:flex");

  const main = (
    <>
      {tab === "editor" && <EditorTab country={activeCountry} onRan={() => setMobile("console")} />}
      {tab === "transactions" && <TransactionsTab />}
      {tab === "contracts" && <ContractsTab />}
      {tab === "explorer" && <ExplorerTab />}
    </>
  );

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-ink">
      <header className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-2 border-b border-line px-3 py-2">
        <Link href="/" title={t("home")} className="flex items-center gap-2 font-serif text-lg">
          <ConstelaMark className="h-5 w-5 text-gold" />
          Constela
        </Link>

        <div className="flex items-center gap-1 rounded-full border border-line p-0.5 text-xs font-medium">
          <span className="rounded-full bg-teal/20 px-2.5 py-1 text-ok">{t("network.testnet")}</span>
          <span title={t("network.mainnetSoon")} aria-disabled="true" className="cursor-not-allowed px-2.5 py-1 text-muted/70">
            {t("network.mainnet")}
          </span>
        </div>

        <nav className="order-last flex w-full overflow-x-auto lg:order-none lg:w-auto lg:flex-1 lg:justify-center" aria-label={t("panels.code")}>
          {TABS.map(([id, Icon]) => (
            <button
              key={id}
              type="button"
              aria-current={tab === id ? "page" : undefined}
              onClick={() => {
                setTab(id);
                setMobile("code");
              }}
              className={`flex shrink-0 items-center gap-2 border-b-2 px-3 py-1.5 text-sm transition-colors ${tab === id ? "border-gold text-gold" : "border-transparent text-muted hover:text-snow"}`}
            >
              <Icon aria-hidden strokeWidth={1.5} className="h-4 w-4" />
              {t(`tabs.${id}`)}
            </button>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <label className="sr-only" htmlFor="country">{t("country")}</label>
          <select
            id="country"
            title={t("country")}
            value={activeCountry}
            onChange={(event) => setCountry(event.target.value as CountryId)}
            className="max-w-36 rounded-full border border-line bg-ink px-3 py-1.5 text-xs"
          >
            {COUNTRIES.map((item) => (
              <option key={item.id} value={item.id}>{item.name[locale]}</option>
            ))}
          </select>
          <LocaleSwitch />
        </div>
      </header>

      {hydrated ? (
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="flex min-h-0 flex-1">
            <aside className={`${hidden("templates")} w-full shrink-0 flex-col border-r border-line lg:w-64`}>
              <TemplatesPanel onPick={() => setMobile("code")} country={activeCountry} />
            </aside>
            <main className={`${hidden("code")} min-w-0 flex-1 flex-col`}>{main}</main>
            <aside className={`${hidden("account")} w-full shrink-0 flex-col border-l border-line lg:w-72`}>
              <AccountPanel />
            </aside>
            {mobile === "console" && (
              <div className="flex min-w-0 flex-1 flex-col lg:hidden">
                <ConsolePanel />
              </div>
            )}
          </div>

          <section className={`hidden shrink-0 flex-col border-t border-line lg:flex ${consoleOpen ? "h-56" : ""}`}>
            {consoleOpen ? (
              <ConsolePanel onCollapse={() => setConsoleOpen(false)} collapseIcon={<ChevronDown aria-hidden className="h-4 w-4" />} />
            ) : (
              <button type="button" onClick={() => setConsoleOpen(true)} className="flex items-center gap-2 px-3 py-1.5 text-sm text-muted hover:text-snow">
                <ChevronUp aria-hidden className="h-4 w-4" />
                {consoleT("expand")}
              </button>
            )}
          </section>
        </div>
      ) : (
        <div className="flex-1 animate-pulse bg-surface" />
      )}

      <nav className="flex shrink-0 border-t border-line lg:hidden" aria-label={t("panels.code")}>
        {MOBILE.map(([id, Icon]) => (
          <button
            key={id}
            type="button"
            aria-current={mobile === id ? "page" : undefined}
            onClick={() => setMobile(id)}
            className={`flex flex-1 flex-col items-center gap-1 py-2 text-xs ${mobile === id ? "text-gold" : "text-muted"}`}
          >
            <Icon aria-hidden strokeWidth={1.5} className="h-5 w-5" />
            {t(`panels.${id}`)}
          </button>
        ))}
      </nav>
    </div>
  );
}
