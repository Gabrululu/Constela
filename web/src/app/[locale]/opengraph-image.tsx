import { ImageResponse } from "next/og";
import { getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { COUNTRIES, type AppLocale } from "@/lib/countries";
import { AMERICAS_PATH, COUNTRY_POINTS } from "@/components/americas-map";
import { ARROW, LABEL_LEFT, midArrowTransform, STREAMS, streamPath } from "@/components/brand";

export const alt = "Constela";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Se genera al construir: compartir un enlace no depende de Google Fonts en ejecución.
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

const MAP_SIZE = 600;
const INK = "#0f0f0f";
const GOLD = "#fdda24";
const SNOW = "#f6f7f8";
const SAND = "#d6d2c4";
const LILAC = "#b7ace8";

/** Satori no lee woff2: sin un navegador moderno como User-Agent, Google Fonts entrega TTF. */
async function loadFont(family: string, text: string): Promise<ArrayBuffer> {
  const css = await (await fetch(`https://fonts.googleapis.com/css2?family=${family}&text=${encodeURIComponent(text)}`)).text();
  const url = css.match(/src: url\((.+?)\)/)?.[1];
  if (!url) throw new Error(`No se pudo cargar la fuente ${family}`);
  return (await fetch(url)).arrayBuffer();
}

export default async function OpenGraphImage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "landing" });
  const common = await getTranslations({ locale, namespace: "common" });

  const title = t("title");
  const eyebrow = t("eyebrow");
  const testnet = common("testnetOnly");
  const names = new Map<string, string>(COUNTRIES.map((country) => [country.id, country.name[locale as AppLocale]]));
  const ids = STREAMS.flat();
  const labels = ids.map((id) => names.get(id)).join("");

  const [lora, inter] = await Promise.all([loadFont("Lora", `Constela${title}`), loadFont("Inter", `${eyebrow}${testnet}${labels}`)]);

  return new ImageResponse(
    <div style={{ display: "flex", width: "100%", height: "100%", background: INK, color: SNOW, fontFamily: "Inter" }}>
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: 640, padding: "64px 0 64px 72px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, fontFamily: "Lora", fontSize: 36 }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="1.25">
            <path d="M4 18 10 11l4 3 6-9" />
            <circle cx="4" cy="18" r="2" fill={GOLD} stroke="none" />
            <circle cx="10" cy="11" r="1.6" fill={GOLD} stroke="none" />
            <circle cx="14" cy="14" r="1.6" fill={GOLD} stroke="none" />
            <circle cx="20" cy="5" r="2" fill={GOLD} stroke="none" />
          </svg>
          Constela
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <div style={{ fontSize: 26, color: LILAC }}>{eyebrow}</div>
          <div style={{ fontFamily: "Lora", fontSize: 64, lineHeight: 1.08, letterSpacing: -1 }}>{title}</div>
        </div>
        <div style={{ fontSize: 21, color: SAND }}>{testnet}</div>
      </div>

      <div style={{ display: "flex", position: "absolute", right: 16, top: 15, width: MAP_SIZE, height: MAP_SIZE }}>
        <svg width={MAP_SIZE} height={MAP_SIZE} viewBox={`0 0 ${MAP_SIZE} ${MAP_SIZE}`}>
          <defs>
            <pattern id="dots" width="7" height="7" patternUnits="userSpaceOnUse">
              <circle cx="1.75" cy="1.75" r="1.2" fill={LILAC} />
            </pattern>
          </defs>
          <path d={AMERICAS_PATH} fill="url(#dots)" opacity="0.8" />
          {STREAMS.map((stream) => (
            <path key={stream.join("-")} d={streamPath(stream).d} fill="none" stroke={SNOW} strokeOpacity="0.5" strokeWidth="2" />
          ))}
          {STREAMS.flatMap((stream) =>
            stream.slice(1).map((to, index) => (
              <polygon key={to} points={ARROW} fill={GOLD} transform={`${midArrowTransform(COUNTRY_POINTS[stream[index]], COUNTRY_POINTS[to])} scale(1.4)`} />
            )),
          )}
          {ids.map((id) => (
            <circle key={id} cx={COUNTRY_POINTS[id][0]} cy={COUNTRY_POINTS[id][1]} r="7" fill={GOLD} />
          ))}
        </svg>
        {ids.map((id) => {
          const [x, y] = COUNTRY_POINTS[id];
          const position = LABEL_LEFT.has(id) ? { right: MAP_SIZE - x + 14 } : { left: x + 14 };
          return (
            <div key={id} style={{ position: "absolute", top: y - 14, fontSize: 21, ...position }}>
              {names.get(id)}
            </div>
          );
        })}
      </div>
    </div>,
    {
      ...size,
      fonts: [
        { name: "Lora", data: lora, weight: 400, style: "normal" },
        { name: "Inter", data: inter, weight: 400, style: "normal" },
      ],
    },
  );
}
