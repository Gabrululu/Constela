import { describe, expect, it } from "vitest";
import es from "../../messages/es.json";
import pt from "../../messages/pt-BR.json";
import { TEMPLATES, renderTemplate } from "../templates/catalog";
import { SOURCES } from "../templates/generated";
import { ArgError, argKind, parseArg } from "./args";
import { COUNTRIES } from "./countries";
import { explainError } from "./errors";
import { NETWORK } from "./network";
import { buildSandboxDocument, sandboxCsp } from "./sandbox";

function keys(value: object, prefix = ""): string[] {
  return Object.entries(value).flatMap(([key, inner]) =>
    typeof inner === "object" && inner ? keys(inner, `${prefix}${key}.`) : [`${prefix}${key}`],
  );
}

describe("traducciones", () => {
  it("español y portugués tienen las mismas claves", () => {
    expect(keys(pt).sort()).toEqual(keys(es).sort());
  });

  it("cada error reconocido tiene su explicación", () => {
    const samples = ["constela_no_account", "op_underfunded", "op_no_trust", "Error(Contract, #3)", "error[E0308]: mismatched types"];
    for (const sample of samples) {
      const explained = explainError(sample);
      expect(explained).not.toBeNull();
      expect(es.errors).toHaveProperty(explained!.key);
    }
    expect(explainError("Error(Contract, #3)")?.values).toEqual({ code: "3" });
  });
});

describe("plantillas", () => {
  it("no dejan tokens sin reemplazar en ningún idioma ni país", () => {
    for (const template of TEMPLATES) {
      expect(SOURCES[template.id], template.id).toBeTruthy();
      for (const locale of ["es", "pt-BR"] as const) {
        for (const country of COUNTRIES) {
          const view = renderTemplate(template, locale, country.id);
          const context = `${template.id}/${locale}/${country.id}`;
          expect(view.code, context).not.toMatch(/\{\{\w+\}\}/);
          expect(view.name, context).not.toMatch(/\{\{\w+\}\}/);
          expect(view.description, context).not.toMatch(/\{\{\w+\}\}/);
        }
      }
    }
  });

  it("los memos caben en los 28 bytes que permite la red", () => {
    for (const template of TEMPLATES) {
      for (const locale of ["es", "pt-BR"] as const) {
        const memo = template.copy[locale].tokens.memo;
        if (memo) expect(new TextEncoder().encode(memo).length, template.id).toBeLessThanOrEqual(28);
      }
    }
  });

  it("ninguna plantilla pide pegar claves secretas", () => {
    for (const source of Object.values(SOURCES)) {
      expect(source).not.toMatch(/fromSecret|CLAVE_SECRETA|SECRET_KEY/);
    }
  });
});

describe("solo testnet", () => {
  it("la configuración de red no apunta a mainnet", () => {
    const config = JSON.stringify(NETWORK);
    expect(config).not.toMatch(/Public Global Stellar Network/);
    expect(config).not.toMatch(/horizon\.stellar\.org/);
    expect(NETWORK.horizonUrl).toContain("testnet");
  });

  it("la CSP del sandbox solo permite hosts de testnet", () => {
    const csp = sandboxCsp();
    expect(csp).toContain("connect-src https://horizon-testnet.stellar.org https://soroban-testnet.stellar.org https://friendbot.stellar.org");
    expect(csp).not.toMatch(/https:\/\/horizon\.stellar\.org/);
    expect(csp).toContain("default-src 'none'");
  });

  it("el código del usuario no puede cerrar la etiqueta script", () => {
    const html = buildSandboxDocument('console.log("</script><img>")', { sdkSource: 'var a="</script><b>"', publicKey: null });
    expect(html).not.toContain('"</script><img>');
    expect(html).not.toContain('"</script><b>');
  });
});

describe("argumentos de contratos", () => {
  it("convierte cada tipo", () => {
    expect(parseArg("u32", "7")).toBe(7);
    expect(parseArg("big", "1000")).toBe(1000n);
    expect(parseArg("big", "-5")).toBe(-5n);
    expect(parseArg("bool", "true")).toBe(true);
    expect(parseArg("vec", "GA, GB\nGC")).toEqual(["GA", "GB", "GC"]);
    expect(parseArg("vec", '["a"]')).toEqual(["a"]);
    expect(parseArg("option", "")).toBeNull();
    expect(parseArg("bytes", "0aff")).toEqual(new Uint8Array([10, 255]));
    expect(argKind("scSpecTypeI128")).toBe("big");
    expect(argKind("scSpecTypeUdt")).toBe("json");
  });

  it("rechaza valores inválidos", () => {
    expect(() => parseArg("u32", "-1")).toThrow(ArgError);
    expect(() => parseArg("big", "1.5")).toThrow(ArgError);
    expect(() => parseArg("address", "abc")).toThrow(ArgError);
    expect(() => parseArg("bool", "si")).toThrow(ArgError);
    expect(() => parseArg("json", "{")).toThrow(ArgError);
  });
});
