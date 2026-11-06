"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { CountryId } from "@/lib/countries";
import type { WalletKind } from "@/lib/wallet";

export type LogLevel = "info" | "success" | "warning" | "error" | "system" | "hint";
export type LogEntry = { id: number; time: string; level: LogLevel; message: string; href?: string };
export type IdeTab = "editor" | "transactions" | "contracts" | "explorer";
export type SavedContract = { id: string; name: string; savedAt: string };
export type Compiled = { wasm: Uint8Array; name: string };
export type Wallet = { kind: WalletKind; publicKey: string } | null;

type IdeState = {
  tab: IdeTab;
  templateId: string;
  country: CountryId | null;
  drafts: Record<string, string>;
  logs: LogEntry[];
  wallet: Wallet;
  compiled: Compiled | null;
  contracts: SavedContract[];
  activeContract: string | null;
  setTab: (tab: IdeTab) => void;
  setTemplate: (id: string) => void;
  setCountry: (country: CountryId) => void;
  setDraft: (id: string, code: string) => void;
  clearDraft: (id: string) => void;
  log: (level: LogLevel, message: string, href?: string) => void;
  clearLogs: () => void;
  setWallet: (wallet: Wallet) => void;
  setCompiled: (compiled: Compiled | null) => void;
  saveContract: (contract: SavedContract) => void;
  removeContract: (id: string) => void;
  openContract: (id: string | null) => void;
};

let logId = 0;
const MAX_LOGS = 500;

export const useIde = create<IdeState>()(
  persist(
    (set) => ({
      tab: "editor",
      templateId: "first-account",
      country: null,
      drafts: {},
      logs: [],
      wallet: null,
      compiled: null,
      contracts: [],
      activeContract: null,
      setTab: (tab) => set({ tab }),
      setTemplate: (templateId) => set({ templateId, tab: "editor" }),
      setCountry: (country) => set({ country }),
      setDraft: (id, code) => set((state) => ({ drafts: { ...state.drafts, [id]: code } })),
      clearDraft: (id) =>
        set((state) => {
          const drafts = { ...state.drafts };
          delete drafts[id];
          return { drafts };
        }),
      log: (level, message, href) =>
        set((state) => ({
          logs: [
            ...state.logs.slice(-(MAX_LOGS - 1)),
            { id: ++logId, time: new Date().toLocaleTimeString(), level, message, href },
          ],
        })),
      clearLogs: () => set({ logs: [] }),
      setWallet: (wallet) => set({ wallet }),
      setCompiled: (compiled) => set({ compiled }),
      saveContract: (contract) =>
        set((state) => ({ contracts: [contract, ...state.contracts.filter((item) => item.id !== contract.id)].slice(0, 30) })),
      removeContract: (id) => set((state) => ({ contracts: state.contracts.filter((item) => item.id !== id) })),
      openContract: (activeContract) => set({ activeContract }),
    }),
    {
      name: "constela.ide",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (state) => ({
        templateId: state.templateId,
        country: state.country,
        drafts: state.drafts,
        contracts: state.contracts,
        wallet: state.wallet?.kind === "practice" ? state.wallet : null,
      }),
    },
  ),
);
