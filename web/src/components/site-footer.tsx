import { useTranslations } from "next-intl";

export function SiteFooter() {
  const t = useTranslations("common");
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-sm text-muted sm:px-6">
        <p className="font-medium text-snow">{t("builtOn")}</p>
        <p className="max-w-2xl">{t("disclaimer")}</p>
        <p>{t("license")}</p>
      </div>
    </footer>
  );
}
