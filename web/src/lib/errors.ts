/** Traduce errores técnicos a una clave de `messages/*.json` con una explicación para principiantes. */
const RULES: Array<[RegExp, string]> = [
  [/constela_no_account/, "noAccount"],
  [/friendbot_failed|friendbot/i, "friendbot"],
  [/op_underfunded|underfunded|insufficient balance/i, "underfunded"],
  [/op_no_trust|trustline entry is missing|trustline/i, "noTrust"],
  [/op_no_destination/, "noDestination"],
  [/op_low_reserve/, "lowReserve"],
  [/tx_bad_seq/, "badSeq"],
  [/tx_insufficient_fee/, "lowFee"],
  [/tx_bad_auth|op_bad_auth/, "badAuth"],
  [/invalid checksum|invalid encoded string|invalid version byte|Invalid StrKey|invalid (public )?key/i, "invalidKey"],
  [/Account not found|Not Found|status code 404/i, "notFound"],
  [/rejected|declined|denied by|cancel/i, "userRejected"],
  [/WasmNotFound|MissingValue|non-existing|does not exist|Contract not found/i, "contractMissing"],
  [/UnexpectedSize|wrong number of args|expected \d+ arg/i, "wrongArgs"],
  [/UnexpectedType|cannot be converted|invalid type/i, "wrongType"],
  [/Error\(Auth|require_auth|authorization/i, "auth"],
  [/Error\(Contract, #(\d+)\)/, "contractError"],
  [/timeout|timed out|Failed to fetch|NetworkError|Network Error/i, "network"],
  [/E0425|cannot find (value|function)/, "rustNotFound"],
  [/E0308|mismatched types/, "rustTypes"],
  [/E0599|no (method|function) named/, "rustMethod"],
  [/E0432|E0433|unresolved import|failed to resolve/, "rustImport"],
  [/E0382|borrow of moved value|use of moved value/, "rustMoved"],
  [/expected .* found|expected `;`|unexpected token/i, "rustSyntax"],
];

export type ExplainedError = { key: string; values?: Record<string, string> };

export function explainError(message: string): ExplainedError | null {
  for (const [pattern, key] of RULES) {
    const match = message.match(pattern);
    if (match) return key === "contractError" ? { key, values: { code: match[1] } } : { key };
  }
  return null;
}
