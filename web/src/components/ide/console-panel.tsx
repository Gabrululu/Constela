"use client";

import { Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, type ReactNode } from "react";
import { useIde, type LogLevel } from "@/store/ide";
import { Button } from "./ui";

const COLORS: Record<LogLevel, string> = {
  info: "text-snow",
  success: "text-ok",
  warning: "text-gold",
  error: "text-danger",
  system: "text-muted",
  hint: "text-lilac",
};

const URL_PATTERN = /(https:\/\/[^\s"]+)/g;

function withLinks(message: string): ReactNode[] {
  return message.split(URL_PATTERN).map((part, index) =>
    part.startsWith("https://") ? (
      <a key={index} href={part} target="_blank" rel="noreferrer noopener" className="underline underline-offset-2 hover:text-gold">
        {part}
      </a>
    ) : (
      part
    ),
  );
}

export function ConsolePanel({ onCollapse, collapseIcon }: { onCollapse?: () => void; collapseIcon?: ReactNode }) {
  const t = useTranslations("console");
  const logs = useIde((state) => state.logs);
  const clearLogs = useIde((state) => state.clearLogs);
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => {
    end.current?.scrollIntoView({ block: "end" });
  }, [logs]);

  return (
    <div className="flex h-full min-h-0 flex-col bg-black">
      <div className="flex shrink-0 items-center justify-between border-b border-line px-3 py-1">
        <h2 className="text-sm font-medium">{t("title")}</h2>
        <div className="flex items-center">
          <Button variant="ghost" className="!py-1" onClick={clearLogs} aria-label={t("clear")} title={t("clear")}>
            <Trash2 aria-hidden strokeWidth={1.5} className="h-4 w-4" />
          </Button>
          {onCollapse && (
            <Button variant="ghost" className="!py-1" onClick={onCollapse} aria-label={t("collapse")} title={t("collapse")}>
              {collapseIcon}
            </Button>
          )}
        </div>
      </div>
      <div role="log" aria-live="polite" className="scrollbar-thin min-h-0 flex-1 overflow-y-auto p-3 font-mono text-[13px] leading-relaxed">
        {logs.length === 0 && <p className="text-muted">{t("empty")}</p>}
        {logs.map((entry) => (
          <div key={entry.id} className="flex gap-3">
            <span className="hidden shrink-0 text-muted/70 sm:block">{entry.time}</span>
            <span className={`min-w-0 whitespace-pre-wrap break-words ${COLORS[entry.level]}`}>{withLinks(entry.message)}</span>
          </div>
        ))}
        <div ref={end} />
      </div>
    </div>
  );
}
