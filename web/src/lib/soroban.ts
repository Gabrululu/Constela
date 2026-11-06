"use client";

import {
  Account,
  Address,
  BASE_FEE,
  Contract,
  Keypair,
  Operation,
  TransactionBuilder,
  contract as sdkContract,
  hash,
  rpc,
  xdr as stellarXdr,
} from "@stellar/stellar-sdk";
import { Buffer } from "buffer";
import { argKind, parseArg, type ArgKind } from "./args";
import { NETWORK } from "./network";

export type SignFn = (xdr: string) => Promise<string>;

export type SpecArg = { name: string; kind: ArgKind; typeLabel: string };
export type SpecFunction = { name: string; doc: string; args: SpecArg[] };

const server = () => new rpc.Server(NETWORK.rpcUrl);

function typeLabel(def: stellarXdr.ScSpecTypeDef): string {
  return def.type.replace("scSpecType", "");
}

export function readSpec(wasm: Uint8Array): sdkContract.Spec {
  return sdkContract.Spec.fromWasm(Buffer.from(wasm));
}

export function specFunctions(spec: sdkContract.Spec): SpecFunction[] {
  return spec.funcs().map((fn) => ({
    name: fn.name.toString(),
    doc: fn.doc.toString().trim(),
    args: fn.inputs.map((input) => ({
      name: input.name.toString(),
      kind: argKind(input.type.type),
      typeLabel: typeLabel(input.type),
    })),
  }));
}

export function toScVals(spec: sdkContract.Spec, fn: SpecFunction, raw: Record<string, string>): stellarXdr.ScVal[] {
  const values: Record<string, unknown> = {};
  for (const arg of fn.args) values[arg.name] = parseArg(arg.kind, raw[arg.name] ?? "");
  return spec.funcArgsToScVals(fn.name, values);
}

async function sendAndWait(tx: Parameters<rpc.Server["prepareTransaction"]>[0], sign: SignFn) {
  const client = server();
  const prepared = await client.prepareTransaction(tx);
  const signed = await sign(prepared.toXDR());
  const sent = await client.sendTransaction(TransactionBuilder.fromXDR(signed, NETWORK.passphrase));
  if (sent.status === "ERROR") throw new Error(JSON.stringify(sent.errorResult?.result.type ?? sent.status));
  const final = await client.pollTransaction(sent.hash, { attempts: 30 });
  if (final.status !== rpc.Api.GetTransactionStatus.SUCCESS) throw new Error(`tx_failed ${final.status}`);
  return { hash: sent.hash, returnValue: final.returnValue };
}

export type DeployStep = "upload" | "create";

export async function deployContract(options: {
  wasm: Uint8Array;
  constructorArgs: stellarXdr.ScVal[];
  publicKey: string;
  sign: SignFn;
  onStep: (step: DeployStep) => void;
}): Promise<{ contractId: string; hash: string }> {
  const { wasm, constructorArgs, publicKey, sign, onStep } = options;
  const client = server();
  const bytes = Buffer.from(wasm);
  const build = (account: Account, operation: stellarXdr.Operation) =>
    new TransactionBuilder(account, { fee: BASE_FEE, networkPassphrase: NETWORK.passphrase })
      .addOperation(operation)
      .setTimeout(60)
      .build();

  onStep("upload");
  await sendAndWait(build(await client.getAccount(publicKey), Operation.uploadContractWasm({ wasm: bytes })), sign);

  onStep("create");
  const created = await sendAndWait(
    build(
      await client.getAccount(publicKey),
      Operation.createCustomContract({
        address: new Address(publicKey),
        wasmHash: hash(bytes),
        salt: Buffer.from(crypto.getRandomValues(new Uint8Array(32))),
        constructorArgs,
      }),
    ),
    sign,
  );
  if (!created.returnValue) throw new Error("tx_failed no_contract_id");
  return { contractId: Address.fromScVal(created.returnValue).toString(), hash: created.hash };
}

export async function loadContractSpec(contractId: string): Promise<sdkContract.Spec> {
  return readSpec(await server().getContractWasmByContractId(contractId));
}

function display(value: unknown): string {
  return JSON.stringify(value, (_, inner) => (typeof inner === "bigint" ? inner.toString() : inner));
}

/** Consulta sin firmar ni pagar: simula con una cuenta temporal si no hay cuenta conectada. */
export async function simulateCall(options: {
  contractId: string;
  spec: sdkContract.Spec;
  fn: SpecFunction;
  args: stellarXdr.ScVal[];
  publicKey: string | null;
}): Promise<{ result: string; needsSignature: boolean }> {
  const { contractId, spec, fn, args, publicKey } = options;
  const source = new Account(publicKey ?? Keypair.random().publicKey(), "0");
  const tx = new TransactionBuilder(source, { fee: BASE_FEE, networkPassphrase: NETWORK.passphrase })
    .addOperation(new Contract(contractId).call(fn.name, ...args))
    .setTimeout(60)
    .build();
  const simulation = await server().simulateTransaction(tx);
  if (rpc.Api.isSimulationError(simulation)) throw new Error(simulation.error);
  const retval = simulation.result?.retval;
  const footprint = simulation.transactionData.build().resources.footprint;
  return {
    result: retval ? display(spec.funcResToNative(fn.name, retval)) : "null",
    needsSignature: footprint.readWrite.length > 0 || (simulation.result?.auth.length ?? 0) > 0,
  };
}

export async function invokeCall(options: {
  contractId: string;
  spec: sdkContract.Spec;
  fn: SpecFunction;
  args: stellarXdr.ScVal[];
  publicKey: string;
  sign: SignFn;
}): Promise<{ result: string; hash: string }> {
  const { contractId, spec, fn, args, publicKey, sign } = options;
  const account = await server().getAccount(publicKey);
  const tx = new TransactionBuilder(account, { fee: BASE_FEE, networkPassphrase: NETWORK.passphrase })
    .addOperation(new Contract(contractId).call(fn.name, ...args))
    .setTimeout(60)
    .build();
  const sent = await sendAndWait(tx, sign);
  return {
    result: sent.returnValue ? display(spec.funcResToNative(fn.name, sent.returnValue)) : "null",
    hash: sent.hash,
  };
}
