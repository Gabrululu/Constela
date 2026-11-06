"use client";

import { useLocale, useTranslations } from "next-intl";
import type { AppLocale, CountryId } from "@/lib/countries";
import { useIde } from "@/store/ide";
import { renderTemplate, TEMPLATES, type TemplateCategory } from "@/templates/catalog";

const CATEGORIES: TemplateCategory[] = ["start", "latam", "contracts"];

export function TemplatesPanel({ onPick, country }: { onPick: () => void; country: CountryId }) {
  const t = useTranslations("templates");
  const locale = useLocale() as AppLocale;
  const templateId = useIde((state) => state.templateId);
  const tab = useIde((state) => state.tab);
  const setTemplate = useIde((state) => state.setTemplate);

  return (
    <div className="scrollbar-thin h-full overflow-y-auto">
      <div className="border-b border-line p-3">
        <h2 className="font-serif text-lg">{t("title")}</h2>
        <p className="text-xs text-muted">{t("hint")}</p>
      </div>
      {CATEGORIES.map((category) => (
        <section key={category} className="border-b border-line py-2">
          <h3 className="px-3 py-1 text-xs font-semibold text-lilac">{t(`categories.${category}`)}</h3>
          <ul>
            {TEMPLATES.filter((template) => template.category === category).map((template) => {
              const view = renderTemplate(template, locale, country);
              const active = tab === "editor" && templateId === template.id;
              return (
                <li key={template.id}>
                  <button
                    type="button"
                    aria-current={active ? "true" : undefined}
                    onClick={() => {
                      setTemplate(template.id);
                      onPick();
                    }}
                    className={`block w-full border-l-2 px-3 py-2 text-left transition-colors ${active ? "border-gold bg-raised" : "border-transparent hover:bg-surface"}`}
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span className={`text-sm font-medium ${active ? "text-gold" : ""}`}>{view.name}</span>
                      <span className="shrink-0 font-mono text-[10px] text-muted">{template.language === "rust" ? "Rust" : "JS"}</span>
                    </span>
                    <span className="mt-0.5 block text-xs leading-snug text-muted">{view.description}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
