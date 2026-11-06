import type { CountryId } from "@/lib/countries";
import { AMERICAS_PATH, COUNTRY_POINTS } from "./americas-map";

/** Identidad propia de Constela: no usa ni imita el logo de Stellar. */
export function ConstelaMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" aria-hidden className={className}>
      <path d="M4 18 10 11l4 3 6-9" />
      <circle cx="4" cy="18" r="2" fill="currentColor" stroke="none" />
      <circle cx="10" cy="11" r="1.6" fill="currentColor" stroke="none" />
      <circle cx="14" cy="14" r="1.6" fill="currentColor" stroke="none" />
      <circle cx="20" cy="5" r="2" fill="currentColor" stroke="none" />
    </svg>
  );
}

type PointId = keyof typeof COUNTRY_POINTS;
type Point = readonly [number, number];

// Cada corriente va por su cuenta: no hace falta que todos los países queden conectados.
export const STREAMS: PointId[][] = [
  ["mx", "cr", "co"],
  ["pe", "bo"],
  ["cl", "ar", "br"],
];

export const LABEL_LEFT = new Set<PointId>(["mx", "cr", "pe", "bo", "cl"]);

const SPEED = 50; // unidades del mapa por segundo
const SPACING = 70; // distancia entre flechas de una misma corriente
const BEND = 0.22; // cuánto se curva cada tramo respecto a su largo
export const ARROW = "-7,-5 7,0 -7,5 -3.5,0";

/** Punto de control de la curva entre dos países: siempre se arquea hacia el mismo lado del recorrido. */
function control([x1, y1]: Point, [x2, y2]: Point): Point {
  return [(x1 + x2) / 2 + (y2 - y1) * BEND, (y1 + y2) / 2 - (x2 - x1) * BEND];
}

/** Transform que deja una flecha fija en el punto medio de la curva, apuntando en su dirección. */
export function midArrowTransform(start: Point, end: Point): string {
  const [cx, cy] = control(start, end);
  const x = (start[0] + end[0]) / 4 + cx / 2;
  const y = (start[1] + end[1]) / 4 + cy / 2;
  const angle = (Math.atan2(end[1] - start[1], end[0] - start[0]) * 180) / Math.PI;
  return `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${angle.toFixed(1)})`;
}

export function streamPath(stream: PointId[]): { d: string; length: number } {
  let d = `M${COUNTRY_POINTS[stream[0]].join(" ")}`;
  let length = 0;
  for (let index = 1; index < stream.length; index++) {
    const from = COUNTRY_POINTS[stream[index - 1]];
    const to = COUNTRY_POINTS[stream[index]];
    const [cx, cy] = control(from, to);
    d += `Q${cx.toFixed(1)} ${cy.toFixed(1)} ${to[0]} ${to[1]}`;
    length += Math.hypot(to[0] - from[0], to[1] - from[1]) * (1 + BEND * BEND);
  }
  return { d, length };
}

export function Constellation({ className, cities }: { className?: string; cities: Array<{ id: CountryId; label: string }> }) {
  const labels = new Map<string, string>(cities.map((city) => [city.id, city.label]));
  const ids = STREAMS.flat();

  return (
    <svg viewBox="0 0 600 600" role="img" aria-label={ids.map((id) => labels.get(id)).join(", ")} className={className}>
      <defs>
        <pattern id="constela-dots" width="7" height="7" patternUnits="userSpaceOnUse">
          <circle cx="1.75" cy="1.75" r="1.2" fill="#b7ace8" />
        </pattern>
        <clipPath id="constela-americas">
          <path d={AMERICAS_PATH} />
        </clipPath>
      </defs>
      <rect width="600" height="600" fill="url(#constela-dots)" opacity="0.8" clipPath="url(#constela-americas)" />

      {STREAMS.map((stream, streamIndex) => {
        const { d, length } = streamPath(stream);
        const seconds = length / SPEED;
        const arrows = Math.max(1, Math.round(length / SPACING));
        return (
          <g key={stream.join("-")}>
            <path
              d={d}
              fill="none"
              pathLength={1}
              // El mapa se encoge en pantallas pequeñas: el trazo y las flechas compensan esa escala.
              className="line-draw stroke-[2.5] lg:stroke-[1.5]"
              style={{ animationDelay: `${streamIndex * 200}ms` }}
              stroke="#f6f7f8"
              strokeOpacity="0.45"
            />
            {Array.from({ length: arrows }, (_, arrow) => {
              const begin = `${((arrow * seconds) / arrows).toFixed(2)}s`;
              const dur = `${seconds.toFixed(2)}s`;
              return (
                // Queda invisible hasta que empieza su recorrido.
                <polygon key={arrow} points={ARROW} fill="#fdda24" opacity="0" className="flow-arrow [transform:scale(1.5)] lg:[transform:none]">
                  <animateMotion path={d} rotate="auto" dur={dur} begin={begin} repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.08;0.92;1" dur={dur} begin={begin} repeatCount="indefinite" />
                </polygon>
              );
            })}
            {stream.slice(1).map((to, index) => (
              <polygon
                key={to}
                points={ARROW}
                fill="#fdda24"
                className="flow-static"
                transform={midArrowTransform(COUNTRY_POINTS[stream[index]], COUNTRY_POINTS[to])}
              />
            ))}
          </g>
        );
      })}

      {ids.map((id, index) => {
        const [x, y] = COUNTRY_POINTS[id];
        const left = LABEL_LEFT.has(id);
        return (
          <g key={id}>
            <circle cx={x} cy={y} r="6" fill="#fdda24" className="star-pulse" style={{ animationDelay: `${index * 350}ms` }} />
            <text
              x={left ? x - 13 : x + 13}
              y={y + 6}
              textAnchor={left ? "end" : "start"}
              fill="#f6f7f8"
              fontFamily="var(--font-inter)"
              stroke="#0f0f0f"
              strokeWidth="4"
              paintOrder="stroke"
              className="text-[24px] lg:text-[19px]"
            >
              {labels.get(id)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
