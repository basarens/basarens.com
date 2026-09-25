import assert from "node:assert/strict";
import test from "node:test";
import { analyzeFinance } from "../lib/finance/analysis.ts";
import { accountDefinition, namedAccount } from "../lib/finance/accounts.ts";

const current = "NL00TEST0000002977";
const sharedSavings = "NL00TEST0000005765";
const personalSavings = "NL00TEST0000002643";
const accounts = [current, sharedSavings, personalSavings].map((iban) => ({ iban, kind: "current" }));

function transaction(date, amount, id, overrides = {}) {
  return {
    fingerprint: id,
    account_iban: current,
    counterparty_iban: null,
    booked_on: date,
    sequence: 1,
    amount_cents: amount,
    balance_cents: 100_000,
    counterparty: amount > 0 ? "Werkgever" : "Winkel",
    description: amount > 0 ? "Salaris" : "Boodschappen",
    category: amount > 0 ? "Salaris" : "Boodschappen",
    is_internal_transfer: false,
    ...overrides,
  };
}

test("known account suffixes fix existing account types", () => {
  assert.deepEqual(accountDefinition(sharedSavings), { label: "Gezamenlijk sparen", kind: "savings", owner: "shared" });
  assert.deepEqual(accountDefinition(personalSavings), { label: "Persoonlijk sparen", kind: "savings", owner: "personal" });
  assert.equal(namedAccount({ iban: current, label: "Rekening", kind: "savings", owner: "personal" }).kind, "current");
});

test("cashflow uses complete months and excludes internal transfers", () => {
  const rows = [
    transaction("2026-06-05", 100_000, "jun-income"),
    transaction("2026-06-08", -50_000, "jun-expense"),
    transaction("2026-07-05", 100_000, "jul-income"),
    transaction("2026-07-08", -40_000, "jul-expense"),
    transaction("2026-08-05", 100_000, "aug-income"),
    transaction("2026-08-08", -30_000, "aug-expense"),
    transaction("2026-08-10", 50_000, "transfer", { counterparty_iban: sharedSavings }),
    transaction("2026-09-05", 20_000, "partial-income"),
    transaction("2026-09-08", -10_000, "partial-expense"),
    transaction("2026-09-10", 0, "shared-balance", { account_iban: sharedSavings, balance_cents: 150_000 }),
    transaction("2026-09-10", 0, "personal-balance", { account_iban: personalSavings, balance_cents: 50_000 }),
  ];
  const result = analyzeFinance(rows, accounts, new Date(2026, 8, 25));
  assert.deepEqual(result.history.map((month) => month.net), [0, 0, 0, 50_000, 60_000, 70_000]);
  assert.deepEqual(result.history.map((month) => month.hasData), [false, false, false, true, true, true]);
  assert.equal(result.observed.net, 10_000);
  assert.equal(result.savingsBalance, 150_000);
  assert.equal(result.totalBalance, 250_000);
  assert.equal(result.changeCents, 10_000);
  assert.equal(Math.round(result.changePercent), 17);
  assert.equal(result.movingAverage, 60_000);
  assert.deepEqual(result.incomeCategories, [["Salaris", 20_000]]);
  assert.equal(result.largestExpenses.length, 2);
});

test("missing months are not treated as zero and zero baseline has no percentage", () => {
  const rows = [transaction("2026-08-05", 10_000, "aug")];
  const result = analyzeFinance(rows, accounts, new Date(2026, 8, 25));
  assert.equal(result.history[0].hasData, false);
  assert.equal(result.changeCents, null);
  assert.equal(result.movingAverage, null);
});

test("personal accounts are hidden, but transfers with joint accounts count as joint cashflow", () => {
  const rows = [
    transaction("2026-09-05", -30_000, "joint-to-personal", { counterparty_iban: personalSavings, is_internal_transfer: true }),
    transaction("2026-09-06", 50_000, "personal-to-joint", { counterparty_iban: personalSavings, is_internal_transfer: true }),
    transaction("2026-09-06", 30_000, "personal-mirror", { account_iban: personalSavings, counterparty_iban: current, is_internal_transfer: true, balance_cents: 800_000 }),
    transaction("2026-09-07", -5_000, "joint-to-joint", { counterparty_iban: sharedSavings, is_internal_transfer: true }),
  ];
  const result = analyzeFinance(rows, accounts, new Date(2026, 8, 25));
  assert.equal(result.observed.net, 20_000);
  assert.equal(result.totalBalance, 100_000);
  assert.equal(result.savingsBalance, 0);
  assert.deepEqual(result.incomeCategories, [["Van privé", 50_000]]);
  assert.deepEqual(result.spendingCategories, [["Naar privé", 30_000]]);
});

test("top expenses use the last two complete months and omit Drienerbrug rent", () => {
  const rows = [
    transaction("2026-06-10", -200_000, "old-expense"),
    transaction("2026-07-10", -20_000, "july-expense"),
    transaction("2026-08-10", -100_000, "rent", { counterparty: "Drienerbrug B.V.", description: "Huur augustus" }),
    transaction("2026-08-12", -30_000, "august-expense"),
    transaction("2026-09-10", -150_000, "current-month-expense"),
  ];
  const result = analyzeFinance(rows, accounts, new Date(2026, 8, 25));
  assert.deepEqual(result.largestExpenses.map((row) => row.fingerprint), ["august-expense", "july-expense"]);
  assert.equal(result.history.at(-1).net, -130_000);
});
