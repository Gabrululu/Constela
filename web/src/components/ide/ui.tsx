"use client";

import { Check, Copy } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode } from "react";

export const inputClass =
  "w-full rounded-lg border border-line bg-ink px-3 py-2 text-sm text-snow placeholder:text-muted/70 focus:border-gold focus:outline-none";

type Variant = "primary" | "secondary" | "ghost";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-gold text-ink hover:brightness-105 disabled:bg-raised disabled:text-muted",
  secondary: "border border-line text-snow hover:border-snow disabled:text-muted disabled:hover:border-line",
  ghost: "text-muted hover:text-snow disabled:opacity-50",
};

export function Button({ variant = "secondary", className = "", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      type="button"
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:active:scale-100 ${VARIANTS[variant]} ${className}`}
    />
  );
}

export function Field({ label, hint, children, htmlFor }: { label: string; hint?: string; htmlFor?: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="block text-sm font-medium">{label}</label>
      {hint && <p className="mt-0.5 text-xs text-muted">{hint}</p>}
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input autoComplete="off" spellCheck={false} {...props} className={`${inputClass} ${props.className ?? ""}`} />;
}

export function CopyButton({ value, label }: { value: string; label?: string }) {
  const t = useTranslations("common");
  const [copied, setCopied] = useState(false);
  return (
    <Button
      variant="ghost"
      className="!px-1.5 !py-1"
      aria-label={label ?? t("copy")}
      title={copied ? t("copied") : t("copy")}
      onClick={async () => {
        await navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
    >
      {copied ? <Check aria-hidden className="h-4 w-4 text-ok" /> : <Copy aria-hidden className="h-4 w-4" />}
    </Button>
  );
}
