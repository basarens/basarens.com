import { analyzeFinance, type AnalysisTransaction, type MonthResult } from "@/lib/finance/analysis";
import { accountDefinition } from "@/lib/finance/accounts";

type Account = { iban: string; kind: string };
const euro = (cents: number) => new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(cents / 100);
const monthLabel = (month: string) => new Intl.DateTimeFormat("nl-NL", { month: "long", year: "numeric" }).format(new Date(`${month}-01T12:00:00`));
const shortMonth = (month: string) => new Intl.DateTimeFormat("nl-NL", { month: "short" }).format(new Date(`${month}-01T12:00:00`));

function CategoryList({ rows, empty }: { rows: [string, number][]; empty: string }) {
  const max = rows[0]?.[1] ?? 1;
  if (!rows.length) return <p className="mt-6 text-sm text-[#789187]">{empty}</p>;
  return <div className="mt-6 space-y-5">{rows.map(([label, amount]) =>
    <div key={label}>
      <div className="mb-2 flex justify-between gap-3 text-sm"><span>{label}</span><strong>{euro(amount)}</strong></div>
      <div className="h-2 rounded-full bg-[#edf1e9]"><div className="h-2 rounded-full bg-[#8caf9e]" style={{ width: `${(amount / max) * 100}%` }} /></div>
    </div>,
  )}</div>;
}

function CashflowChart({ months }: { months: MonthResult[] }) {
  const max = Math.max(1, ...months.filter((result) => result.hasData).map((result) => Math.abs(result.net)));
  const label = months.map((result) => `${monthLabel(result.month)}: ${result.hasData ? euro(result.net) : "geen gegevens"}`).join("; ");
  return <div className="overflow-x-auto"><svg role="img" aria-label={`Netto cashflow per volledige maand. ${label}`} viewBox="0 0 720 250" className="mt-5 w-full min-w-[720px]">
    <line x1="36" x2="690" y1="115" y2="115" stroke="#cbd8cf" strokeWidth="2" />
    <text x="0" y="118" fill="#71877f" fontSize="12">€ 0</text>
    {months.map((result, index) => {
      const x = 64 + index * 108;
      const height = Math.max(result.net === 0 ? 3 : 8, Math.abs(result.net) / max * 75);
      const y = result.net >= 0 ? 115 - height : 115;
      return <g key={result.month}>
        {result.hasData ? <>
          <rect x={x} y={y} width="64" height={height} rx="8" fill={result.net >= 0 ? "#75a58e" : "#d98678"} />
          <text x={x + 32} y={result.net >= 0 ? Math.max(17, y - 10) : Math.min(208, y + height + 19)} textAnchor="middle" fill="#173a36" fontSize="12" fontWeight="600">{euro(result.net)}</text>
        </> : <text x={x + 32} y="98" textAnchor="middle" fill="#789187" fontSize="12">Geen data</text>}
        <text x={x + 32} y="231" textAnchor="middle" fill="#5d746d" fontSize="14">{shortMonth(result.month)}</text>
      </g>;
    })}
  </svg></div>;
}

export function FinanceInsights({ transactions, accounts }: { transactions: AnalysisTransaction[]; accounts: Account[] }) {
  const result = analyzeFinance(transactions, accounts);
  const comparison = result.changeCents;
  const changeDirection = comparison === null ? null : comparison > 0 ? "verbeterd" : comparison < 0 ? "verslechterd" : "gelijk gebleven";
  const trendColor = comparison === null || comparison === 0 ? "text-[#173a36]" : comparison > 0 ? "text-emerald-700" : "text-rose-700";
  const expensePeriod = result.observed.month;

  return <>
    <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Kerncijfers">
      {[["Gezamenlijk saldo", result.totalBalance], ["Gezamenlijk sparen", result.savingsBalance], [`Inkomsten ${shortMonth(result.observed.month)}`, result.observed.income], [`Uitgaven ${shortMonth(result.observed.month)}`, result.observed.spending]].map(([label, value]) =>
        <div key={label} className="rounded-2xl border border-[#e2e8df] bg-white p-6"><p className="text-sm text-[#71877f]">{label}</p><p className="mt-3 text-3xl font-semibold tracking-tight">{euro(value as number)}</p></div>,
      )}
    </section>
    <section className="mt-4 rounded-2xl bg-[#123e37] p-7 text-white">
      <p className="text-sm text-[#bad3c5]">Netto cashflow · {monthLabel(result.observed.month)}</p>
      <p className="mt-2 text-4xl font-semibold">{euro(result.observed.net)}</p>
      <p className="mt-3 text-xs leading-relaxed text-[#c5d8cf]">Alleen gezamenlijke rekeningen. Overboekingen tussen die twee rekeningen tellen niet mee; geld van en naar privé wel. De nieuwste maand kan nog onvolledig zijn.</p>
    </section>
    <section className="mt-8 grid gap-6 lg:grid-cols-[1.45fr_0.55fr]" aria-label="Cashflowontwikkeling">
      <div className="rounded-2xl border border-[#e2e8df] bg-white p-6">
        <h2 className="text-xl font-semibold">Netto cashflow over tijd</h2>
        <p className="mt-1 text-sm text-[#71877f]">Laatste zes volledige kalendermaanden</p>
        <CashflowChart months={result.history} />
      </div>
      <div className="flex flex-col justify-between rounded-2xl border border-[#e2e8df] bg-white p-6">
        <div>
          <h2 className="text-xl font-semibold">Gaan jullie vooruit?</h2>
          {comparison === null ? <p className="mt-5 text-sm leading-relaxed text-[#71877f]">Er zijn twee opeenvolgende volledige maanden nodig voor een vergelijking.</p> : <>
            <p className={`mt-5 text-3xl font-semibold ${trendColor}`}>{result.changePercent === null ? "—" : `${result.changePercent > 0 ? "+" : ""}${Math.round(result.changePercent)}%`}</p>
            <p className="mt-2 text-sm leading-relaxed text-[#5d746d]">{monthLabel(result.latest.month)} is {changeDirection} met {euro(Math.abs(comparison))} tegenover {monthLabel(result.previous.month)}.</p>
            <p className="mt-2 text-xs text-[#789187]">Percentage = verschil gedeeld door het absolute resultaat van de vorige maand. Bij € 0 vorige maand tonen we alleen het verschil in euro.</p>
          </>}
        </div>
        <div className="mt-8 border-t border-[#e2e8df] pt-5"><p className="text-sm text-[#71877f]">Gemiddelde netto cashflow · 3 maanden</p><p className="mt-2 text-2xl font-semibold">{result.movingAverage === null ? "—" : euro(result.movingAverage)}</p>{result.movingAverage === null && <p className="mt-1 text-xs text-[#789187]">Nog onvoldoende complete maandgegevens.</p>}</div>
      </div>
    </section>
    <section className="mt-8 grid gap-6 lg:grid-cols-2">
      <div className="rounded-2xl border border-[#e2e8df] bg-white p-6"><h2 className="text-xl font-semibold">Uitgaven per categorie</h2><p className="mt-1 text-sm text-[#71877f]">{monthLabel(expensePeriod)}</p><CategoryList rows={result.spendingCategories} empty="Nog geen uitgaven in deze maand." /><p className="mt-5 text-xs text-[#789187]">Categorieën zijn automatische schattingen. Controleer vooral ‘Overig’.</p></div>
      <div className="rounded-2xl border border-[#e2e8df] bg-white p-6"><h2 className="text-xl font-semibold">Inkomsten per categorie</h2><p className="mt-1 text-sm text-[#71877f]">{monthLabel(expensePeriod)}</p><CategoryList rows={result.incomeCategories} empty="Nog geen inkomsten in deze maand." /><p className="mt-5 text-xs text-[#789187]">Salaris, teruggaven, rente en verkoop worden herkend uit omschrijvingen. De rest staat bij ‘Overig’.</p></div>
    </section>
    <section className="mt-8 rounded-2xl border border-[#e2e8df] bg-white p-6">
      <h2 className="text-xl font-semibold">10 grootste uitgaven</h2>
      <p className="mt-1 text-sm text-[#71877f]">De laatste zes volledige maanden, op gezamenlijke rekeningen</p>
      <ol className="mt-5 divide-y divide-[#edf1e9]">{result.largestExpenses.map((transaction, index) =>
        <li key={transaction.fingerprint} className="flex items-center gap-4 py-3 text-sm">
          <span className="w-5 shrink-0 font-mono text-xs text-[#789187]">{index + 1}</span>
          <div className="min-w-0 flex-1"><p className="truncate font-medium">{accountDefinition(transaction.counterparty_iban ?? "")?.owner === "personal" ? "Overboeking naar privé" : transaction.counterparty || transaction.description || "Transactie"}</p><p className="text-xs text-[#789187]">{transaction.booked_on} · {accountDefinition(transaction.counterparty_iban ?? "")?.owner === "personal" ? "Naar privé" : transaction.category}</p></div>
          <strong className="shrink-0">{euro(transaction.amount_cents)}</strong>
        </li>,
      )}</ol>
      {!result.largestExpenses.length && <p className="mt-5 text-sm text-[#789187]">Nog geen uitgaven voor deze periode.</p>}
    </section>
  </>;
}
