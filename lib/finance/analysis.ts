import { accountDefinition } from "./accounts.ts";

export type AnalysisTransaction = {
  fingerprint: string;
  account_iban: string;
  counterparty_iban?: string | null;
  booked_on: string;
  sequence: number;
  amount_cents: number;
  balance_cents: number | null;
  counterparty: string | null;
  description: string;
  category: string;
  is_internal_transfer: boolean;
};

type AnalysisAccount = { iban: string; kind: string };

export type MonthResult = {
  month: string;
  hasData: boolean;
  income: number;
  spending: number;
  net: number;
};

function monthBefore(month: string, count = 1) {
  const [year, index] = month.split("-").map(Number);
  const date = new Date(year, index - 1 - count, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function todayMonth(now: Date) {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function incomeCategory(transaction: AnalysisTransaction) {
  const text = `${transaction.description} ${transaction.counterparty ?? ""}`.toLowerCase();
  if (transaction.category === "Salaris" || /salaris|loon|payroll|salary/.test(text)) return "Salaris";
  if (/belastingdienst|teruggaaf|teruggave|refund|retour|restitutie/.test(text)) return "Teruggaven";
  if (/rente|interest/.test(text)) return "Rente";
  if (/marktplaats|vinted|verkoop/.test(text)) return "Verkoop";
  return "Overig";
}

export function analyzeFinance(transactions: AnalysisTransaction[], accounts: AnalysisAccount[], now = new Date()) {
  const sorted = transactions.filter((transaction) => accountDefinition(transaction.account_iban)?.owner === "shared").sort(
    (a, b) => b.booked_on.localeCompare(a.booked_on) || b.sequence - a.sequence,
  );
  const external = sorted.filter((transaction) =>
    transaction.counterparty_iban
      ? accountDefinition(transaction.counterparty_iban)?.owner !== "shared"
      : !transaction.is_internal_transfer,
  );
  const latestBalance = new Map<string, number>();
  for (const transaction of sorted) {
    if (!latestBalance.has(transaction.account_iban) && transaction.balance_cents !== null) {
      latestBalance.set(transaction.account_iban, transaction.balance_cents);
    }
  }
  const totalBalance = [...latestBalance.values()].reduce((sum, value) => sum + value, 0);
  const savingsBalance = accounts.reduce((sum, account) =>
    sum + (accountDefinition(account.iban)?.owner === "shared" && accountDefinition(account.iban)?.kind === "savings"
      ? latestBalance.get(account.iban) ?? 0
      : 0), 0);

  const observedMonth = sorted[0]?.booked_on.slice(0, 7) ?? todayMonth(now);
  const calendarMonth = todayMonth(now);
  const lastCompleteMonth = observedMonth < calendarMonth ? observedMonth : monthBefore(calendarMonth);

  function summarize(month: string): MonthResult {
    const allRows = sorted.filter((transaction) => transaction.booked_on.startsWith(month));
    const rows = external.filter((transaction) => transaction.booked_on.startsWith(month));
    const income = rows.reduce((sum, transaction) => sum + Math.max(0, transaction.amount_cents), 0);
    const spending = rows.reduce((sum, transaction) => sum + Math.max(0, -transaction.amount_cents), 0);
    return { month, hasData: allRows.length > 0, income, spending, net: income - spending };
  }

  const observed = summarize(observedMonth);
  const history = [5, 4, 3, 2, 1, 0].map((offset) => summarize(monthBefore(lastCompleteMonth, offset)));
  const [older, previous, latest] = history.slice(-3);
  const comparable = previous.hasData && latest.hasData;
  const changeCents = comparable ? latest.net - previous.net : null;
  const changePercent = comparable && previous.net !== 0
    ? ((latest.net - previous.net) / Math.abs(previous.net)) * 100
    : null;
  const completeMonths = history.slice(-3).filter((result) => result.hasData);
  const movingAverage = completeMonths.length === 3
    ? Math.round(completeMonths.reduce((sum, result) => sum + result.net, 0) / 3)
    : null;

  const observedExpenses = external.filter((transaction) =>
    transaction.booked_on.startsWith(observedMonth) && transaction.amount_cents < 0,
  );
  const spendingCategories = Object.entries(observedExpenses.reduce<Record<string, number>>((result, transaction) => {
    const category = transaction.counterparty_iban && accountDefinition(transaction.counterparty_iban)?.owner === "personal"
      ? "Naar privé" : transaction.category;
    result[category] = (result[category] ?? 0) - transaction.amount_cents;
    return result;
  }, {})).sort((a, b) => b[1] - a[1]);

  const observedIncome = external.filter((transaction) =>
    transaction.booked_on.startsWith(observedMonth) && transaction.amount_cents > 0,
  );
  const incomeCategories = Object.entries(observedIncome.reduce<Record<string, number>>((result, transaction) => {
    const category = transaction.counterparty_iban && accountDefinition(transaction.counterparty_iban)?.owner === "personal"
      ? "Van privé" : incomeCategory(transaction);
    result[category] = (result[category] ?? 0) + transaction.amount_cents;
    return result;
  }, {})).sort((a, b) => b[1] - a[1]);

  const historyMonths = new Set(history.map((result) => result.month));
  const largestExpenses = external
    .filter((transaction) => historyMonths.has(transaction.booked_on.slice(0, 7)) && transaction.amount_cents < 0)
    .sort((a, b) => a.amount_cents - b.amount_cents)
    .slice(0, 10);

  return {
    observed,
    history,
    previous,
    latest,
    older,
    changeCents,
    changePercent,
    movingAverage,
    totalBalance,
    savingsBalance,
    spendingCategories,
    incomeCategories,
    largestExpenses,
  };
}
