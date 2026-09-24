import type { FinanceTransaction } from "./import";

export type LocalAccount = { iban: string; label: string; kind: "current" | "savings"; owner: "shared" | "personal" };
export type LocalGoal = { id: string; label: string; target_cents: number };
export type LocalFinanceData = {
  version: 1;
  accounts: LocalAccount[];
  transactions: FinanceTransaction[];
  goals: LocalGoal[];
};

export type VaultEnvelope = { version: 1; salt: string; iv: string; ciphertext: string };
const dbName = "basarens-finance-local";
const recordKey = "vault";
const iterations = 310_000;

function bytesToBase64(bytes: Uint8Array) {
  let value = "";
  for (const byte of bytes) value += String.fromCharCode(byte);
  return btoa(value);
}

function base64ToBytes(value: string) {
  return Uint8Array.from(atob(value), (character) => character.charCodeAt(0));
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, 1);
    request.onupgradeneeded = () => request.result.createObjectStore("data");
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error("Lokale opslag is niet beschikbaar in deze browser."));
  });
}

export async function readVault(): Promise<VaultEnvelope | null> {
  const db = await openDatabase();
  try {
    return await new Promise((resolve, reject) => {
      const request = db.transaction("data", "readonly").objectStore("data").get(recordKey);
      request.onsuccess = () => resolve((request.result as VaultEnvelope | undefined) ?? null);
      request.onerror = () => reject(new Error("De lokale kluis kan niet worden gelezen."));
    });
  } finally {
    db.close();
  }
}

async function writeVault(envelope: VaultEnvelope) {
  const db = await openDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction("data", "readwrite");
      transaction.objectStore("data").put(envelope, recordKey);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(new Error("De lokale kluis kon niet worden opgeslagen."));
    });
  } finally {
    db.close();
  }
}

async function keyFromPassword(password: string, salt: Uint8Array) {
  const baseKey = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: salt as BufferSource, iterations, hash: "SHA-256" },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

export async function saveLocalFinance(key: CryptoKey, data: LocalFinanceData, salt: string) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const plaintext = new TextEncoder().encode(JSON.stringify(data));
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, plaintext);
  const envelope: VaultEnvelope = {
    version: 1,
    salt,
    iv: bytesToBase64(iv),
    ciphertext: bytesToBase64(new Uint8Array(ciphertext)),
  };
  await writeVault(envelope);
  return envelope;
}

export async function createLocalFinance(password: string) {
  if (password.length < 12) throw new Error("Gebruik een wachtzin van minimaal 12 tekens.");
  if (await readVault()) throw new Error("Op dit apparaat bestaat al een Finance-kluis.");
  const salt = bytesToBase64(crypto.getRandomValues(new Uint8Array(16)));
  const key = await keyFromPassword(password, base64ToBytes(salt));
  const data: LocalFinanceData = { version: 1, accounts: [], transactions: [], goals: [] };
  const envelope = await saveLocalFinance(key, data, salt);
  return { key, data, envelope };
}

export async function unlockLocalFinance(password: string, envelope: VaultEnvelope) {
  try {
    const key = await keyFromPassword(password, base64ToBytes(envelope.salt));
    const plaintext = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: base64ToBytes(envelope.iv) as BufferSource },
      key,
      base64ToBytes(envelope.ciphertext) as BufferSource,
    );
    const data = JSON.parse(new TextDecoder().decode(plaintext)) as LocalFinanceData;
    if (data.version !== 1 || !Array.isArray(data.transactions) || !Array.isArray(data.accounts) || !Array.isArray(data.goals)) {
      throw new Error("invalid vault");
    }
    return { key, data };
  } catch {
    throw new Error("De wachtzin klopt niet of de back-up is beschadigd.");
  }
}

export async function restoreLocalFinance(envelope: VaultEnvelope, password: string) {
  if (envelope.version !== 1 || typeof envelope.salt !== "string" || typeof envelope.iv !== "string" || typeof envelope.ciphertext !== "string") {
    throw new Error("Dit is geen geldige Finance-back-up.");
  }
  const opened = await unlockLocalFinance(password, envelope);
  await writeVault(envelope);
  return opened;
}
