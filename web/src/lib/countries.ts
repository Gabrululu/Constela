export type AppLocale = "es" | "pt-BR";

export type CountryId = "latam" | "pe" | "mx" | "ar" | "co" | "cr" | "bo" | "cl" | "br";

type Country = {
  id: CountryId;
  name: Record<AppLocale, string>;
  currency: string;
  city: Record<AppLocale, string>;
  /** Nombre local del ahorro rotativo. `verified: false` usa el término genérico hasta que la comunidad lo valide. */
  circle: Record<AppLocale, string>;
  verified: boolean;
  people: [string, string, string];
};

const GENERIC_CIRCLE = { es: "círculo de ahorro", "pt-BR": "círculo de poupança" };

export const COUNTRIES: Country[] = [
  { id: "latam", name: { es: "Latinoamérica", "pt-BR": "América Latina" }, currency: "USD", city: { es: "tu ciudad", "pt-BR": "sua cidade" }, circle: GENERIC_CIRCLE, verified: false, people: ["Ana", "Luis", "Marta"] },
  { id: "pe", name: { es: "Perú", "pt-BR": "Peru" }, currency: "PEN", city: { es: "Lima", "pt-BR": "Lima" }, circle: { es: "junta", "pt-BR": "junta" }, verified: true, people: ["Rosa", "Marco", "Elena"] },
  { id: "mx", name: { es: "México", "pt-BR": "México" }, currency: "MXN", city: { es: "Guadalajara", "pt-BR": "Guadalajara" }, circle: { es: "tanda", "pt-BR": "tanda" }, verified: true, people: ["Lupita", "Diego", "Fernanda"] },
  { id: "ar", name: { es: "Argentina", "pt-BR": "Argentina" }, currency: "ARS", city: { es: "Córdoba", "pt-BR": "Córdoba" }, circle: GENERIC_CIRCLE, verified: false, people: ["Sol", "Tomás", "Lucía"] },
  { id: "co", name: { es: "Colombia", "pt-BR": "Colômbia" }, currency: "COP", city: { es: "Medellín", "pt-BR": "Medellín" }, circle: { es: "natillera", "pt-BR": "natillera" }, verified: true, people: ["Paola", "Andrés", "Camila"] },
  { id: "cr", name: { es: "Costa Rica", "pt-BR": "Costa Rica" }, currency: "CRC", city: { es: "San José", "pt-BR": "San José" }, circle: GENERIC_CIRCLE, verified: false, people: ["Sofía", "Esteban", "Valeria"] },
  { id: "bo", name: { es: "Bolivia", "pt-BR": "Bolívia" }, currency: "BOB", city: { es: "La Paz", "pt-BR": "La Paz" }, circle: { es: "pasanaku", "pt-BR": "pasanaku" }, verified: true, people: ["Wara", "Javier", "Nayra"] },
  { id: "cl", name: { es: "Chile", "pt-BR": "Chile" }, currency: "CLP", city: { es: "Valparaíso", "pt-BR": "Valparaíso" }, circle: GENERIC_CIRCLE, verified: false, people: ["Antonia", "Matías", "Josefa"] },
  { id: "br", name: { es: "Brasil", "pt-BR": "Brasil" }, currency: "BRL", city: { es: "Recife", "pt-BR": "Recife" }, circle: { es: "caixinha", "pt-BR": "caixinha" }, verified: true, people: ["Joana", "Rafael", "Bia"] },
];

export function getCountry(id: CountryId): Country {
  return COUNTRIES.find((country) => country.id === id) ?? COUNTRIES[0];
}

export function defaultCountry(locale: AppLocale): CountryId {
  return locale === "pt-BR" ? "br" : "latam";
}

export function countryTokens(id: CountryId, locale: AppLocale): Record<string, string> {
  const country = getCountry(id);
  return {
    country: country.name[locale],
    city: country.city[locale],
    currency: country.currency,
    circle: country.circle[locale],
    name0: country.people[0],
    name1: country.people[1],
    name2: country.people[2],
  };
}
