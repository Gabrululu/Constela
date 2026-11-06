import { ArrowRight, FlaskConical, Laptop, Puzzle } from "lucide-react";
import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { use } from "react";
import { ConstelaMark, Constellation } from "@/components/brand";
import { LocaleSwitch } from "@/components/locale-switch";
import { SiteFooter } from "@/components/site-footer";
import { Link } from "@/i18n/navigation";
import { COUNTRIES, type AppLocale } from "@/lib/countries";

const STEPS = ["account", "code", "run", "deploy"] as const;
const WORKSHOP = [
  ["ready", Laptop],
  ["safe", FlaskConical],
  ["open", Puzzle],
] as const;

export default function LandingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  setRequestLocale(locale);
  const t = useTranslations("landing");
  const common = useTranslations("common");
  const appLocale = locale as AppLocale;
  const countries = COUNTRIES.filter((country) => country.id !== "latam");

  return (
    <div className="min-h-dvh overflow-x-hidden">
      <header className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-5 sm:px-6">
        <span className="flex items-center gap-2 font-serif text-xl">
          <ConstelaMark className="h-6 w-6 text-gold" />
          Constela
        </span>
        <nav className="flex items-center gap-3 text-sm">
          <LocaleSwitch />
          <Link href="/ide" className="hidden rounded-full border border-line px-4 py-2 transition-colors hover:border-gold hover:text-gold sm:block">
            {t("nav.open")}
          </Link>
        </nav>
      </header>

      <main>
        <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 pb-20 pt-10 sm:px-6 lg:grid-cols-[1.15fr_1fr] lg:pt-16">
          <div>
            <p className="mb-5 text-sm font-medium text-lilac">{t("eyebrow")}</p>
            <h1 className="max-w-[16ch] font-serif text-5xl leading-[1.06] tracking-tight text-balance sm:text-6xl lg:text-7xl">{t("title")}</h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-sand">{t("lead")}</p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link href="/ide" className="group inline-flex items-center gap-3 rounded-full bg-gold py-3 pl-6 pr-4 font-semibold text-ink transition-transform active:scale-[0.98]">
                {t("cta")}
                <ArrowRight aria-hidden className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <a href="#pasos" className="rounded-full border border-line px-6 py-3 transition-colors hover:border-snow">
                {t("ctaSecondary")}
              </a>
            </div>
            <p className="mt-5 text-sm text-muted">{common("testnetOnly")}</p>
          </div>
          <Constellation
            className="mx-auto w-full max-w-md lg:max-w-none"
            cities={countries.map((country) => ({ id: country.id, label: country.name[appLocale] }))}
          />
        </section>

        <section id="pasos" className="border-t border-line bg-surface">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
            <h2 className="max-w-2xl font-serif text-4xl tracking-tight">{t("stepsTitle")}</h2>
            <ol className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-line bg-line md:grid-cols-2 lg:grid-cols-4">
              {STEPS.map((step, index) => (
                <li key={step} className="bg-surface p-6">
                  <span className="font-mono text-sm text-gold">0{index + 1}</span>
                  <h3 className="mt-6 text-lg font-semibold">{t(`steps.${step}.title`)}</h3>
                  <p className="mt-2 leading-relaxed text-muted">{t(`steps.${step}.body`)}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="border-b border-line">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
            <h2 className="font-serif text-4xl tracking-tight">{t("workshopTitle")}</h2>
            <div className="mt-12 grid gap-10 md:grid-cols-3">
              {WORKSHOP.map(([key, Icon]) => (
                <div key={key}>
                  <Icon aria-hidden strokeWidth={1.25} className="h-8 w-8 text-snow" />
                  <h3 className="mt-5 text-lg font-semibold">{t(`workshop.${key}.title`)}</h3>
                  <p className="mt-2 leading-relaxed text-muted">{t(`workshop.${key}.body`)}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden">
          <div aria-hidden className="halftone absolute inset-y-0 right-0 w-1/2 opacity-30 [mask-image:linear-gradient(to_left,black,transparent)]" />
          <div className="relative mx-auto flex max-w-6xl flex-col items-start gap-8 px-4 py-24 sm:px-6">
            <h2 className="max-w-2xl font-serif text-4xl tracking-tight text-balance sm:text-5xl">{t("closingTitle")}</h2>
            <Link href="/ide" className="inline-flex items-center gap-3 rounded-full bg-gold py-3 pl-6 pr-4 font-semibold text-ink transition-transform active:scale-[0.98]">
              {t("closingCta")}
              <ArrowRight aria-hidden className="h-5 w-5" />
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
