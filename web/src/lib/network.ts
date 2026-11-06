/**
 * Única configuración de red de la app. Mainnet no está habilitada: no existe ninguna URL ni
 * passphrase de mainnet en el código, así que ninguna ruta puede firmar o enviar a la red real.
 */
export const NETWORK = {
  name: "testnet",
  passphrase: "Test SDF Network ; September 2015",
  horizonUrl: "https://horizon-testnet.stellar.org",
  rpcUrl: "https://soroban-testnet.stellar.org",
  friendbotUrl: "https://friendbot.stellar.org",
  explorerUrl: "https://stellar.expert/explorer/testnet",
} as const;

export const explorer = {
  account: (id: string) => `${NETWORK.explorerUrl}/account/${id}`,
  tx: (hash: string) => `${NETWORK.explorerUrl}/tx/${hash}`,
  contract: (id: string) => `${NETWORK.explorerUrl}/contract/${id}`,
};

export const COMPILER_URL = process.env.NEXT_PUBLIC_COMPILER_URL ?? "http://localhost:8787";

export function shortKey(key: string): string {
  return key.length <= 12 ? key : `${key.slice(0, 6)}…${key.slice(-4)}`;
}
