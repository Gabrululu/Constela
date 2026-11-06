/** Convierte lo que escribe el usuario al valor nativo que espera `Spec.funcArgsToScVals`. */
export type ArgKind =
  | "address" | "bool" | "u32" | "i32" | "big" | "string" | "symbol" | "bytes" | "vec" | "option" | "json";

const KINDS: Record<string, ArgKind> = {
  scSpecTypeAddress: "address",
  scSpecTypeMuxedAddress: "address",
  scSpecTypeBool: "bool",
  scSpecTypeU32: "u32",
  scSpecTypeI32: "i32",
  scSpecTypeU64: "big",
  scSpecTypeI64: "big",
  scSpecTypeU128: "big",
  scSpecTypeI128: "big",
  scSpecTypeU256: "big",
  scSpecTypeI256: "big",
  scSpecTypeTimepoint: "big",
  scSpecTypeDuration: "big",
  scSpecTypeString: "string",
  scSpecTypeSymbol: "symbol",
  scSpecTypeBytes: "bytes",
  scSpecTypeBytesN: "bytes",
  scSpecTypeVec: "vec",
  scSpecTypeOption: "option",
};

export function argKind(specTypeName: string): ArgKind {
  return KINDS[specTypeName] ?? "json";
}

export class ArgError extends Error {
  readonly kind: ArgKind;
  constructor(kind: ArgKind) {
    super(`invalid_${kind}`);
    this.kind = kind;
  }
}

export function parseArg(kind: ArgKind, raw: string): unknown {
  const value = raw.trim();
  switch (kind) {
    case "bool":
      if (value === "true" || value === "false") return value === "true";
      throw new ArgError(kind);
    case "u32":
    case "i32": {
      if (!/^-?\d+$/.test(value)) throw new ArgError(kind);
      const parsed = Number(value);
      if (kind === "u32" && parsed < 0) throw new ArgError(kind);
      return parsed;
    }
    case "big":
      if (!/^-?\d+$/.test(value)) throw new ArgError(kind);
      return BigInt(value);
    case "address":
      if (!/^[GC][A-Z2-7]{55}$/.test(value)) throw new ArgError(kind);
      return value;
    case "bytes":
      if (!/^([0-9a-fA-F]{2})*$/.test(value)) throw new ArgError(kind);
      return Uint8Array.from(value.match(/../g)?.map((byte) => parseInt(byte, 16)) ?? []);
    case "vec":
      if (value.startsWith("[")) return parseJson(kind, value);
      return value ? value.split(/[\s,]+/).filter(Boolean) : [];
    case "option":
      return value ? value : null;
    case "json":
      return parseJson(kind, value);
    default:
      return value;
  }
}

function parseJson(kind: ArgKind, value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    throw new ArgError(kind);
  }
}
