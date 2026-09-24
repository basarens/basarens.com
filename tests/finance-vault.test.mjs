import assert from "node:assert/strict";
import test from "node:test";
import { indexedDB } from "fake-indexeddb";
import { createLocalFinance, readVault, restoreLocalFinance, saveLocalFinance, unlockLocalFinance } from "../lib/finance/local-vault.ts";
import { parseBankFile } from "../lib/finance/import.ts";

globalThis.indexedDB = indexedDB;

test("bank import and encrypted local backup", async () => {
  const csv = [
    '"IBAN/BBAN","Datum","Bedrag","Saldo na trn","Volgnr","Tegenrekening IBAN/BBAN","Naam tegenpartij","Omschrijving-1"',
    '"NL00TEST0000000001","2026-09-01","-12,34","1234,56","1","NL00TEST0000000002","Test","Een \"omschrijving"',
  ].join("\n");
  const parsed = await parseBankFile(new File([csv], "bank.csv"));
  assert.equal(parsed.transactions[0].amount_cents, -1234);
  assert.equal(parsed.transactions[0].balance_cents, 123456);

  const password = "test-wachtzin-met-veel-tekens";
  const created = await createLocalFinance(password);
  const updated = { ...created.data, transactions: parsed.transactions };
  const backup = await saveLocalFinance(created.key, updated, created.envelope.salt);
  const stored = await readVault();
  assert.equal(JSON.stringify(stored).includes("omschrijving"), false);
  await assert.rejects(unlockLocalFinance("foute-wachtzin", stored));
  assert.equal((await unlockLocalFinance(password, stored)).data.transactions.length, 1);
  assert.equal((await restoreLocalFinance(backup, password)).data.transactions.length, 1);
});
