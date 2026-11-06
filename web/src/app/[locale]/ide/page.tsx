import { setRequestLocale } from "next-intl/server";
import { use } from "react";
import { IdeShell } from "@/components/ide/shell";

export default function IdePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  setRequestLocale(locale);
  return <IdeShell />;
}
