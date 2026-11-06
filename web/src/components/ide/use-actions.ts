"use client";

import { useTranslations } from "next-intl";
import { useCallback } from "react";
import { explainError } from "@/lib/errors";
import { signXdr } from "@/lib/wallet";
import { useIde } from "@/store/ide";

/** Registra el error y, si lo reconoce, añade su explicación en el idioma de la persona. */
export function useReportError() {
  const log = useIde((state) => state.log);
  const t = useTranslations("errors");
  return useCallback(
    (error: unknown) => {
      const message = errorMessage(error);
      log("error", message);
      const explained = explainError(message);
      if (explained) log("hint", `${t("prefix")} ${t(explained.key, explained.values ?? {})}`);
    },
    [log, t],
  );
}

export function errorMessage(error: unknown): string {
  const horizon = (error as { response?: { data?: { extras?: { result_codes?: unknown } } } })?.response?.data?.extras?.result_codes;
  if (horizon) return JSON.stringify(horizon);
  if (error instanceof Error) return error.message;
  const shaped = error as { message?: string; code?: number } | undefined;
  return shaped?.message ?? String(error);
}

export function useSigner() {
  const wallet = useIde((state) => state.wallet);
  return useCallback(
    (xdr: string) => {
      if (!wallet) throw new Error("constela_no_account");
      return signXdr(wallet.kind, wallet.publicKey, xdr);
    },
    [wallet],
  );
}
