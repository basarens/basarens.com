import type { Metadata } from "next";
import Link from "next/link";
import { FinanceImport, FinanceLogin } from "@/components/finance-forms";
import { LocalFinance } from "@/components/local-finance";
import { saveFinanceAccount, saveFinanceGoal, signOutFinance } from "./actions";
import { financeConfigured, getFinanceAccess } from "@/lib/finance/supabase";

export const metadata: Metadata = { title: "Finance — Bas Arens", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

type Transaction = {
  fingerprint: string;
  account_iban: string;
  booked_on: string;
  sequence: number;
  amount_cents: number;
  balance_cents: number | null;
  counterparty: string | null;
  description: string;
  category: string;
  is_internal_transfer: boolean;
};
type Account = { iban: string; label: string; kind: string; owner: string };
type Goal = { id: string; label: string; target_cents: number };

const money = (cents: number) => new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(cents / 100);
const monthLabel = (month: string) => new Intl.DateTimeFormat("nl-NL", { month: "long", year: "numeric" }).format(new Date(`${month}-01T12:00:00`));

async function loadTransactions(client: NonNullable<Awaited<ReturnType<typeof getFinanceAccess>>>["client"]) {
  const rows: Transaction[] = [];
  for (let offset = 0; offset < 20_000; offset += 1000) {
    const { data, error } = await client.from("finance_transactions")
      .select("fingerprint,account_iban,booked_on,sequence,amount_cents,balance_cents,counterparty,description,category,is_internal_transfer")
      .order("booked_on", { ascending: false })
      .order("sequence", { ascending: false })
      .range(offset, offset + 999);
    if (error) throw error;
    rows.push(...((data ?? []) as Transaction[]));
    if (!data || data.length < 1000) break;
  }
  return rows;
}

export default async function FinancePage() {
  const configured = financeConfigured();
  if (!configured) return <LocalFinance />;
  const access = await getFinanceAccess();
  if (!access) return (
    <main className="min-h-screen bg-[#f5f6f2] px-5 py-10 text-[#173a36]">
      <div className="mx-auto max-w-md">
        <Link href="/" className="text-sm text-[#54736b]">← basarens.com</Link>
        <div className="mt-20 rounded-3xl border border-[#e2e8df] bg-white p-8 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#6b8a80]">Persoonlijke omgeving</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight">Finance<span className="text-[#b7c88b]">.</span></h1>
          <p className="mt-3 text-sm leading-relaxed text-[#5d746d]">Jullie geld, doelen en maandelijkse keuzes op één rustige plek.</p>
          {configured ? <FinanceLogin /> : <p className="mt-8 rounded-xl bg-[#f3f5ee] p-4 text-sm">De privé-database is nog niet gekoppeld. Volg de stappen in de Finance-inrichting om deze module te activeren.</p>}
        </div>
      </div>
    </main>
  );

  const [{ data: accountData, error: accountsError }, { data: goalData, error: goalsError }, transactions] = await Promise.all([
    access.client.from("finance_accounts").select("iban,label,kind,owner").order("label"),
    access.client.from("finance_goals").select("id,label,target_cents").order("created_at"),
    loadTransactions(access.client),
  ]);
  if (accountsError || goalsError) throw new Error("De Finance-database is nog niet ingericht.");
  const accounts = (accountData ?? []) as Account[];
  const goals = (goalData ?? []) as Goal[];
  const latestBalance = new Map<string, number>();
  for (const transaction of transactions) {
    if (!latestBalance.has(transaction.account_iban) && transaction.balance_cents !== null) {
      latestBalance.set(transaction.account_iban, transaction.balance_cents);
    }
  }
  const total = [...latestBalance.values()].reduce((sum, value) => sum + value, 0);
  const savings = accounts.filter((a) => a.kind === "savings").reduce((sum, a) => sum + (latestBalance.get(a.iban) ?? 0), 0);
  const months = [...new Set(transactions.map((t) => t.booked_on.slice(0, 7)))].sort().reverse();
  const month = months[0] ?? new Date().toISOString().slice(0, 7);
  const current = transactions.filter((t) => t.booked_on.startsWith(month) && !t.is_internal_transfer);
  const income = current.filter((t) => t.amount_cents > 0).reduce((sum, t) => sum + t.amount_cents, 0);
  const spending = -current.filter((t) => t.amount_cents < 0).reduce((sum, t) => sum + t.amount_cents, 0);
  const categories = Object.entries(current.filter((t) => t.amount_cents < 0).reduce<Record<string, number>>((result, t) => {
    result[t.category] = (result[t.category] ?? 0) - t.amount_cents;
    return result;
  }, {})).sort((a, b) => b[1] - a[1]);
  const maxCategory = categories[0]?.[1] || 1;

  return (
    <main className="min-h-screen bg-[#f5f6f2] text-[#173a36]">
      <div className="mx-auto max-w-6xl px-5 py-7 sm:px-9">
        <header className="flex items-center justify-between gap-4 border-b border-[#dfe6dc] pb-6">
          <div><Link href="/" className="text-xs text-[#6c877e]">← basarens.com</Link><p className="mt-2 text-2xl font-semibold tracking-tight">Finance<span className="text-[#b7c88b]">.</span></p></div>
          <form action={signOutFinance}><button className="rounded-full border border-[#ccdbd0] px-4 py-2 text-sm">Uitloggen</button></form>
        </header>
        <div className="mt-10 flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#789187]">Gezamenlijk overzicht</p><h1 className="mt-2 text-4xl font-semibold tracking-tight">Goed zicht op jullie geld.</h1></div><p className="text-sm capitalize text-[#6c877e]">{monthLabel(month)} · bijgewerkt na import</p></div>
        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Kerncijfers">
          {[["Totaal saldo", total], ["Op spaarrekeningen", savings], ["Inkomsten deze maand", income], ["Uitgaven deze maand", spending]].map(([label, value]) => <div key={label} className="rounded-2xl border border-[#e2e8df] bg-white p-6"><p className="text-sm text-[#71877f]">{label}</p><p className="mt-3 text-3xl font-semibold tracking-tight">{money(value as number)}</p></div>)}
        </section>
        <div className="mt-4 rounded-2xl bg-[#123e37] p-7 text-white sm:flex sm:items-center sm:justify-between"><div><p className="text-sm text-[#bad3c5]">Netto cashflow deze maand</p><p className="mt-2 text-4xl font-semibold">{money(income - spending)}</p></div><p className="mt-4 max-w-md text-sm leading-relaxed text-[#c5d8cf] sm:mt-0">Interne overboekingen tussen de geïmporteerde rekeningen tellen niet mee als inkomsten of uitgaven. Een lopende maand is nog onvolledig.</p></div>
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-[#e2e8df] bg-white p-6"><h2 className="text-xl font-semibold">Uitgaven per categorie</h2>{categories.length ? <div className="mt-6 space-y-5">{categories.map(([label, amount]) => <div key={label}><div className="mb-2 flex justify-between gap-3 text-sm"><span>{label}</span><strong>{money(amount)}</strong></div><div className="h-2 rounded-full bg-[#edf1e9]"><div className="h-2 rounded-full bg-[#8caf9e]" style={{ width: `${(amount / maxCategory) * 100}%` }} /></div></div>)}</div> : <p className="mt-6 text-sm text-[#789187]">Importeer een bankbestand om de verdeling te zien.</p>}<p className="mt-6 text-xs text-[#789187]">Categorieën worden voorlopig automatisch geschat. Controleer vooral ‘Overig’.</p></section>
          <section className="rounded-2xl border border-[#e2e8df] bg-white p-6"><h2 className="text-xl font-semibold">Rekeningen</h2><div className="mt-5 space-y-5">{accounts.map((a) => <div key={a.iban} className="border-b border-[#edf1e9] pb-4 last:border-0"><div className="flex justify-between gap-4"><span className="text-sm">{a.label}</span><strong>{money(latestBalance.get(a.iban) ?? 0)}</strong></div><form action={saveFinanceAccount} className="mt-2 flex gap-2"><input type="hidden" name="iban" value={a.iban} /><select name="owner" defaultValue={a.owner} aria-label="Eigenaar" className="rounded-lg border border-[#e2e8df] px-2 py-1 text-xs"><option value="shared">Gezamenlijk</option><option value="personal">Persoonlijk</option></select><select name="kind" defaultValue={a.kind} aria-label="Type rekening" className="rounded-lg border border-[#e2e8df] px-2 py-1 text-xs"><option value="current">Lopend</option><option value="savings">Sparen</option></select><button className="text-xs underline">Bewaar</button></form></div>)}</div>{!accounts.length && <p className="mt-5 text-sm text-[#789187]">Nog geen rekeningen geïmporteerd.</p>}</section>
        </div>
        <section className="mt-8 rounded-2xl border border-[#e2e8df] bg-white p-6"><h2 className="text-xl font-semibold">Spaardoelen</h2><div className="mt-5 grid gap-3 sm:grid-cols-2">{goals.map((goal) => <div key={goal.id} className="rounded-xl bg-[#f5f7f2] p-4"><p className="font-medium">{goal.label}</p><p className="mt-1 text-sm text-[#71877f]">Doel: {money(goal.target_cents)}</p></div>)}</div><form action={saveFinanceGoal} className="mt-5 flex flex-wrap gap-2"><input name="label" placeholder="Nieuw doel" aria-label="Naam spaardoel" required maxLength={80} className="min-w-0 flex-1 rounded-xl border border-[#e2e8df] px-3 py-2 text-sm" /><input name="target" placeholder="Bedrag in €" aria-label="Doelbedrag" required inputMode="decimal" className="w-36 rounded-xl border border-[#e2e8df] px-3 py-2 text-sm" /><button className="rounded-xl bg-[#dbe9d9] px-4 py-2 text-sm font-medium">Doel toevoegen</button></form><p className="mt-3 text-xs text-[#789187]">De voortgang per potje volgt zodra een spaardoel aan een rekening is gekoppeld.</p></section>
        <section className="mt-8 rounded-2xl border border-[#e2e8df] bg-white p-6"><h2 className="text-xl font-semibold">Bankbestand importeren</h2><p className="mt-2 mb-5 text-sm text-[#71877f]">Gebruik jullie ING-export met de vier rekeningen. Het originele bestand wordt niet bewaard; dubbele transacties worden overgeslagen.</p><FinanceImport /></section>
        <section className="mt-8 rounded-2xl border border-[#e2e8df] bg-white p-6"><h2 className="text-xl font-semibold">Recente transacties</h2><div className="mt-5 divide-y divide-[#edf1e9]">{transactions.slice(0, 20).map((t) => <div key={t.fingerprint} className="flex items-center justify-between gap-4 py-3 text-sm"><div className="min-w-0"><p className="truncate font-medium">{t.counterparty || t.description || "Transactie"}</p><p className="text-xs text-[#789187]">{t.booked_on} · {t.is_internal_transfer ? "Interne overboeking" : t.category}</p></div><strong className={t.amount_cents < 0 ? "text-[#173a36]" : "text-emerald-700"}>{money(t.amount_cents)}</strong></div>)}</div>{!transactions.length && <p className="text-sm text-[#789187]">Nog geen transacties.</p>}</section>
      </div>
    </main>
  );
}
