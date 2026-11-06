"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";

const OPTIONS = [
  { locale: "es", label: "ES" },
  { locale: "pt-BR", label: "PT" },
] as const;

export function LocaleSwitch() {
  const current = useLocale();
  const pathname = usePathname();
  const t = useTranslations("ide");
  return (
    <div role="group" aria-label={t("language")} className="flex rounded-full border border-line p-0.5 text-xs font-medium">
      {OPTIONS.map(({ locale, label }) => (
        <Link
          key={locale}
          href={pathname}
          locale={locale}
          aria-current={current === locale ? "true" : undefined}
          className={`rounded-full px-2.5 py-1 transition-colors ${current === locale ? "bg-snow text-ink" : "text-muted hover:text-snow"}`}
        >
          {label}
        </Link>
      ))}
    </div>
  );
}
