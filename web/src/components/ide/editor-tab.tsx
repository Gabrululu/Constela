"use client";

import Editor, { loader, type BeforeMount } from "@monaco-editor/react";
import { ArrowRight, Download, Hammer, Lightbulb, Play, RotateCcw } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { compileContract } from "@/lib/compiler";
import type { AppLocale, CountryId } from "@/lib/countries";
import { buildSandboxDocument, loadSdkSource } from "@/lib/sandbox";
import { useIde, type LogLevel } from "@/store/ide";
import { getTemplate, renderTemplate, TEMPLATES } from "@/templates/catalog";
import { Button } from "./ui";
import { useReportError, useSigner } from "./use-actions";

// Sin esto el editor se descarga de un CDN público, que una red de taller puede bloquear.
loader.config({ paths: { vs: "/vendor/monaco/vs" } });

const defineTheme: BeforeMount = (monaco) => {
  monaco.editor.defineTheme("constela", {
    base: "vs-dark",
    inherit: true,
    rules: [
      { token: "keyword", foreground: "FDDA24" },
      { token: "string", foreground: "4FD1C5" },
      { token: "comment", foreground: "A8A8A8", fontStyle: "italic" },
      { token: "number", foreground: "B7ACE8" },
      { token: "type", foreground: "B7ACE8" },
    ],
    colors: {
      "editor.background": "#0F0F0F",
      "editor.foreground": "#F6F7F8",
      "editor.lineHighlightBackground": "#171717",
      "editor.selectionBackground": "#FDDA2433",
      "editorLineNumber.foreground": "#6E6E6E",
      "editorLineNumber.activeForeground": "#D6D2C4",
      "editorCursor.foreground": "#FDDA24",
      "editorWidget.background": "#171717",
      "editorSuggestWidget.background": "#171717",
      "editorSuggestWidget.border": "#303030",
    },
  });
};

// Friendbot puede tardar más de 10 s por cuenta y hay plantillas que crean varias.
const RUN_TIMEOUT_MS = 180_000;

export function EditorTab({ country, onRan }: { country: CountryId; onRan: () => void }) {
  const t = useTranslations("editor");
  const locale = useLocale() as AppLocale;
  const templateId = useIde((state) => state.templateId);
  const draft = useIde((state) => state.drafts[templateId]);
  const setDraft = useIde((state) => state.setDraft);
  const clearDraft = useIde((state) => state.clearDraft);
  const log = useIde((state) => state.log);
  const wallet = useIde((state) => state.wallet);
  const compiled = useIde((state) => state.compiled);
  const setCompiled = useIde((state) => state.setCompiled);
  const setTab = useIde((state) => state.setTab);
  const report = useReportError();
  const sign = useSigner();
  const [running, setRunning] = useState(false);
  const stopRun = useRef<(() => void) | null>(null);

  const template = getTemplate(templateId) ?? TEMPLATES[0];
  const view = useMemo(() => renderTemplate(template, locale, country), [template, locale, country]);
  const code = draft ?? view.code;
  const isRust = template.language === "rust";

  useEffect(() => () => stopRun.current?.(), []);

  const run = useCallback(async () => {
    setRunning(true);
    onRan();
    log("system", t("started", { name: view.name }));

    let sdkSource: string;
    try {
      sdkSource = await loadSdkSource();
    } catch (error) {
      report(error);
      setRunning(false);
      return;
    }

    const frame = document.createElement("iframe");
    frame.setAttribute("sandbox", "allow-scripts");
    frame.style.display = "none";

    const stop = () => {
      window.removeEventListener("message", onMessage);
      clearTimeout(timer);
      frame.remove();
      stopRun.current = null;
      setRunning(false);
    };

    const onMessage = async (event: MessageEvent) => {
      if (event.source !== frame.contentWindow) return;
      const data = event.data;
      if (data?.type === "log") {
        log(data.level as LogLevel, String(data.message));
      } else if (data?.type === "sign") {
        const reply = (body: object) => frame.contentWindow?.postMessage({ type: "sign-result", id: data.id, ...body }, "*");
        try {
          reply({ xdr: await sign(String(data.xdr)) });
        } catch (error) {
          reply({ error: error instanceof Error ? error.message : String(error) });
        }
      } else if (data?.type === "failed") {
        report(new Error(String(data.message)));
        stop();
      } else if (data?.type === "done") {
        log("success", t("finished"));
        stop();
      }
    };

    const timer = setTimeout(() => {
      log("warning", t("timeout"));
      stop();
    }, RUN_TIMEOUT_MS);

    stopRun.current = stop;
    window.addEventListener("message", onMessage);
    frame.srcdoc = buildSandboxDocument(code, { sdkSource, publicKey: wallet?.publicKey ?? null });
    document.body.appendChild(frame);
  }, [code, log, onRan, report, sign, t, view.name, wallet]);

  const compile = useCallback(async () => {
    setRunning(true);
    onRan();
    setCompiled(null);
    log("system", t("compileStart"));
    try {
      const result = await compileContract(code, (line) => {
        const level: LogLevel = /^error/.test(line) ? "error" : /^warning/.test(line) ? "warning" : "system";
        if (level === "error") report(new Error(line));
        else log(level, line);
      });
      if (result.ok) {
        setCompiled({ wasm: result.wasm, name: view.name });
        log("success", t("compileOk", { size: (result.wasm.length / 1024).toFixed(1) }));
      } else {
        log("error", t(`compileFail.${result.reason}`));
      }
    } catch (error) {
      report(error);
    } finally {
      setRunning(false);
    }
  }, [code, log, onRan, report, setCompiled, t, view.name]);

  const download = () => {
    const url = URL.createObjectURL(new Blob([code], { type: "text/plain" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = isRust ? "lib.rs" : `${template.id}.js`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-line px-3 py-2">
        <h2 className="min-w-0 flex-1 truncate font-medium">{view.name}</h2>
        {draft !== undefined && (
          <Button
            variant="ghost"
            title={t("reset")}
            onClick={() => {
              if (window.confirm(t("resetConfirm"))) clearDraft(template.id);
            }}
          >
            <RotateCcw aria-hidden strokeWidth={1.5} className="h-4 w-4" />
            <span className="hidden sm:inline">{t("reset")}</span>
          </Button>
        )}
        <Button variant="ghost" onClick={download} title={t("download")}>
          <Download aria-hidden strokeWidth={1.5} className="h-4 w-4" />
          <span className="hidden sm:inline">{t("download")}</span>
        </Button>
        {isRust && compiled && (
          <Button onClick={() => setTab("contracts")}>
            {t("goDeploy")}
            <ArrowRight aria-hidden className="h-4 w-4" />
          </Button>
        )}
        <Button variant="primary" disabled={running} onClick={isRust ? compile : run}>
          {isRust ? <Hammer aria-hidden strokeWidth={1.5} className="h-4 w-4" /> : <Play aria-hidden strokeWidth={1.5} className="h-4 w-4" />}
          {isRust ? (running ? t("compiling") : t("compile")) : running ? t("running") : t("run")}
        </Button>
      </div>

      <p className="flex shrink-0 items-start gap-2 border-b border-line bg-surface px-3 py-2 text-sm text-sand">
        <Lightbulb aria-hidden strokeWidth={1.5} className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
        {view.tip}
      </p>

      <div className="min-h-0 flex-1">
        <Editor
          key={`${template.id}-${locale}-${country}`}
          height="100%"
          language={template.language}
          value={code}
          theme="constela"
          beforeMount={defineTheme}
          onChange={(value) => {
            const next = value ?? "";
            if (next !== view.code) setDraft(template.id, next);
          }}
          options={{
            fontFamily: "var(--font-plex-mono), monospace",
            fontSize: 14,
            lineHeight: 22,
            minimap: { enabled: false },
            wordWrap: "on",
            scrollBeyondLastLine: false,
            tabSize: 2,
            padding: { top: 12, bottom: 12 },
            automaticLayout: true,
          }}
        />
      </div>
    </div>
  );
}
