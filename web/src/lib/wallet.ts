"use client";

import { Keypair, TransactionBuilder } from "@stellar/stellar-sdk";
import { NETWORK } from "./network";

const PRACTICE_KEY = "constela.practice-secret";

/**
 * Cuenta de práctica: una clave de testnet generada y guardada solo en este navegador.
 * Nunca sale de aquí ni entra al iframe donde corre el código del usuario.
 */
export const practice = {
  read(): string | null {
    try {
      return localStorage.getItem(PRACTICE_KEY);
    } catch {
      return null;
    }
  },
  create(): string {
    const pair = Keypair.random();
    try {
      localStorage.setItem(PRACTICE_KEY, pair.secret());
    } catch {
      // Sin almacenamiento la cuenta vive solo en esta pestaña.
      memorySecret = pair.secret();
    }
    return pair.publicKey();
  },
  forget() {
    memorySecret = null;
    try {
      localStorage.removeItem(PRACTICE_KEY);
    } catch {
      // Nada que borrar.
    }
  },
  publicKey(): string | null {
    const secret = this.read() ?? memorySecret;
    return secret ? Keypair.fromSecret(secret).publicKey() : null;
  },
  sign(xdr: string): string {
    const secret = this.read() ?? memorySecret;
    if (!secret) throw new Error("constela_no_account");
    const tx = TransactionBuilder.fromXDR(xdr, NETWORK.passphrase);
    tx.sign(Keypair.fromSecret(secret));
    return tx.toXDR();
  },
};

let memorySecret: string | null = null;

export async function fundWithFriendbot(publicKey: string): Promise<void> {
  const response = await fetch(`${NETWORK.friendbotUrl}?addr=${encodeURIComponent(publicKey)}`);
  if (!response.ok) throw new Error(`friendbot_failed ${response.status}`);
}

let kitReady: Promise<typeof import("@creit.tech/stellar-wallets-kit/sdk")> | null = null;

/** Carga el kit solo al usarlo y con módulos elegidos, para no descargar conectores que no se usan. */
function loadKit() {
  kitReady ??= (async () => {
    const [sdk, types, varial, albedo, xbull, lobstr, rabet, hana] = await Promise.all([
      import("@creit.tech/stellar-wallets-kit/sdk"),
      import("@creit.tech/stellar-wallets-kit/types"),
      import("@creit.tech/stellar-wallets-kit/modules/varial"),
      import("@creit.tech/stellar-wallets-kit/modules/albedo"),
      import("@creit.tech/stellar-wallets-kit/modules/xbull"),
      import("@creit.tech/stellar-wallets-kit/modules/lobstr"),
      import("@creit.tech/stellar-wallets-kit/modules/rabet"),
      import("@creit.tech/stellar-wallets-kit/modules/hana"),
    ]);
    sdk.StellarWalletsKit.init({
      modules: [
        new varial.VarialModule(),
        new albedo.AlbedoModule(),
        new xbull.xBullModule(),
        new lobstr.LobstrModule(),
        new rabet.RabetModule(),
        new hana.HanaModule(),
      ],
      network: types.Networks.TESTNET,
    });
    return sdk;
  })();
  return kitReady;
}

export async function connectExternalWallet(): Promise<string> {
  const { StellarWalletsKit } = await loadKit();
  const { address } = await StellarWalletsKit.authModal();
  return address;
}

export async function disconnectExternalWallet(): Promise<void> {
  if (!kitReady) return;
  const { StellarWalletsKit } = await kitReady;
  await StellarWalletsKit.disconnect();
}

export type WalletKind = "practice" | "external";

/** Toda firma pasa por aquí y siempre con la passphrase de testnet. */
export async function signXdr(kind: WalletKind, publicKey: string, xdr: string): Promise<string> {
  if (kind === "practice") return practice.sign(xdr);
  const { StellarWalletsKit } = await loadKit();
  const { signedTxXdr } = await StellarWalletsKit.signTransaction(xdr, {
    networkPassphrase: NETWORK.passphrase,
    address: publicKey,
  });
  return signedTxXdr;
}
