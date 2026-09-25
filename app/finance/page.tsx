import type { Metadata } from "next";
import Link from "next/link";
import { FinanceImport, FinanceLogin } from "@/components/finance-forms";
import { FinanceInsights } from "@/components/finance-insights";
import { LocalFinance } from "@/components/local-finance";
import { namedAccount } from "@/lib/finance/accounts";
import { saveFinanceGoal, signOutFinance } from "./actions";
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
  const accounts = ((accountData ?? []) as Account[]).map(namedAccount);
  const goals = (goalData ?? []) as Goal[];
  return (
    <main className="min-h-screen bg-[#f5f6f2] text-[#173a36]">
      <div className="mx-auto max-w-6xl px-5 py-7 sm:px-9">
        <header className="flex items-center justify-between gap-4 border-b border-[#dfe6dc] pb-6">
          <div><Link href="/" className="text-xs text-[#6c877e]">← basarens.com</Link><p className="mt-2 text-2xl font-semibold tracking-tight">Finance<span className="text-[#b7c88b]">.</span></p></div>
          <form action={signOutFinance}><button className="rounded-full border border-[#ccdbd0] px-4 py-2 text-sm">Uitloggen</button></form>
        </header>
        <div className="mt-10 flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#789187]">Gezamenlijk overzicht</p><h1 className="mt-2 text-4xl font-semibold tracking-tight">Goed zicht op jullie geld.</h1></div><p className="text-sm text-[#6c877e]">Bijgewerkt na import</p></div>
        <FinanceInsights transactions={transactions} accounts={accounts} />
        <section className="mt-8 rounded-2xl border border-[#e2e8df] bg-white p-6"><h2 className="text-xl font-semibold">Spaardoelen</h2><div className="mt-5 grid gap-3 sm:grid-cols-2">{goals.map((goal) => <div key={goal.id} className="rounded-xl bg-[#f5f7f2] p-4"><p className="font-medium">{goal.label}</p><p className="mt-1 text-sm text-[#71877f]">Doel: {money(goal.target_cents)}</p></div>)}</div><form action={saveFinanceGoal} className="mt-5 flex flex-wrap gap-2"><input name="label" placeholder="Nieuw doel" aria-label="Naam spaardoel" required maxLength={80} className="min-w-0 flex-1 rounded-xl border border-[#e2e8df] px-3 py-2 text-sm" /><input name="target" placeholder="Bedrag in €" aria-label="Doelbedrag" required inputMode="decimal" className="w-36 rounded-xl border border-[#e2e8df] px-3 py-2 text-sm" /><button className="rounded-xl bg-[#dbe9d9] px-4 py-2 text-sm font-medium">Doel toevoegen</button></form><p className="mt-3 text-xs text-[#789187]">De voortgang per potje volgt zodra een spaardoel aan een rekening is gekoppeld.</p></section>
        <section className="mt-8 rounded-2xl border border-[#e2e8df] bg-white p-6"><h2 className="text-xl font-semibold">Bankbestand importeren</h2><p className="mt-2 mb-5 text-sm text-[#71877f]">Gebruik jullie ING-export met de vier rekeningen. Het originele bestand wordt niet bewaard; dubbele transacties worden overgeslagen.</p><FinanceImport /></section>
      </div>
    </main>
  );
}
