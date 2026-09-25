"use client";

import Link from "next/link";
import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { accountDefinition, namedAccount } from "@/lib/finance/accounts";
import { FinanceInsights } from "@/components/finance-insights";
import { parseBankFile } from "@/lib/finance/import";
import {
  createLocalFinance,
  readVault,
  restoreLocalFinance,
  saveLocalFinance,
  unlockLocalFinance,
  type LocalFinanceData,
  type VaultEnvelope,
} from "@/lib/finance/local-vault";

const euro = (value: number) => new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(value / 100);

function applyFixedAccounts(data: LocalFinanceData): LocalFinanceData {
  return { ...data, accounts: data.accounts.map(namedAccount) };
}

export function LocalFinance() {
  const [loading, setLoading] = useState(true);
  const [vault, setVault] = useState<VaultEnvelope | null>(null);
  const [key, setKey] = useState<CryptoKey | null>(null);
  const [data, setData] = useState<LocalFinanceData | null>(null);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    readVault().then(setVault).catch((error) => setMessage(error.message)).finally(() => setLoading(false));
  }, []);

  async function create(event: FormEvent) {
    event.preventDefault();
    if (password !== confirmation) return setMessage("De wachtzinnen zijn niet gelijk.");
    setBusy(true);
    try {
      const created = await createLocalFinance(password);
      setVault(created.envelope); setKey(created.key); setData(created.data); setPassword(""); setConfirmation(""); setMessage("");
    } catch (error) { setMessage((error as Error).message); }
    finally { setBusy(false); }
  }

  async function unlock(event: FormEvent) {
    event.preventDefault();
    if (!vault) return;
    setBusy(true);
    try {
      const opened = await unlockLocalFinance(password, vault);
      const normalized = applyFixedAccounts(opened.data);
      const changed = normalized.accounts.some((account, index) =>
        account.label !== opened.data.accounts[index].label ||
        account.kind !== opened.data.accounts[index].kind ||
        account.owner !== opened.data.accounts[index].owner,
      );
      const envelope = changed ? await saveLocalFinance(opened.key, normalized, vault.salt) : vault;
      setVault(envelope); setKey(opened.key); setData(normalized); setPassword(""); setMessage("");
    } catch (error) { setMessage((error as Error).message); }
    finally { setBusy(false); }
  }

  async function persist(next: LocalFinanceData) {
    if (!key || !vault) throw new Error("De kluis is vergrendeld.");
    const saved = await saveLocalFinance(key, next, vault.salt);
    setVault(saved); setData(next);
  }

  async function importFile(event: ChangeEvent<HTMLInputElement>) {
    const input = event.target;
    const file = input.files?.[0];
    if (!file || !data) return;
    setBusy(true); setMessage("");
    try {
      const imported = await parseBankFile(file);
      const known = new Set(data.accounts.map((account) => account.iban));
      const accounts = [...data.accounts];
      for (const iban of imported.accounts) if (!known.has(iban)) {
        const definition = accountDefinition(iban);
        accounts.push({
          iban,
          label: definition?.label ?? `Rekening •••• ${iban.slice(-4)}`,
          kind: definition?.kind ?? "current",
          owner: definition?.owner ?? "shared",
        });
        known.add(iban);
      }
      const fingerprints = new Set(data.transactions.map((transaction) => transaction.fingerprint));
      const added = imported.transactions.filter((transaction) => !fingerprints.has(transaction.fingerprint));
      const transactions = [...data.transactions, ...added]
        .map((transaction) => ({ ...transaction, is_internal_transfer: Boolean(transaction.counterparty_iban && known.has(transaction.counterparty_iban)) }))
        .sort((a, b) => b.booked_on.localeCompare(a.booked_on) || b.sequence - a.sequence);
      await persist({ ...data, accounts: accounts.map(namedAccount), transactions });
      setMessage(`${added.length} nieuwe transacties opgeslagen. ${imported.transactions.length - added.length} dubbelen overgeslagen.`);
    } catch (error) { setMessage((error as Error).message); }
    finally { setBusy(false); input.value = ""; }
  }

  async function addGoal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!data) return;
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const label = String(form.get("label") ?? "").trim().slice(0, 80);
    const amount = Number(String(form.get("target") ?? "").replace(",", "."));
    if (!label || !Number.isFinite(amount) || amount <= 0) return setMessage("Vul een naam en geldig doelbedrag in.");
    try {
      await persist({ ...data, goals: [...data.goals, { id: crypto.randomUUID(), label, target_cents: Math.round(amount * 100) }] });
      formElement.reset(); setMessage("Spaardoel toegevoegd.");
    } catch (error) { setMessage((error as Error).message); }
  }

  function downloadBackup() {
    if (!vault) return;
    const file = new Blob([JSON.stringify(vault)], { type: "application/json" });
    const url = URL.createObjectURL(file);
    const link = document.createElement("a");
    link.href = url; link.download = `finance-backup-${new Date().toISOString().slice(0, 10)}.json`; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function restore(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 20_000_000) return setMessage("De back-up is te groot.");
    setBusy(true);
    try {
      const envelope = JSON.parse(await file.text()) as VaultEnvelope;
      const opened = await restoreLocalFinance(envelope, password);
      const normalized = applyFixedAccounts(opened.data);
      const saved = await saveLocalFinance(opened.key, normalized, envelope.salt);
      setVault(saved); setKey(opened.key); setData(normalized); setPassword(""); setMessage("Back-up hersteld.");
    } catch (error) { setMessage((error as Error).message); }
    finally { setBusy(false); event.target.value = ""; }
  }

  if (loading) return <main className="min-h-screen bg-[#f5f6f2] p-8 text-[#173a36]">Finance laden…</main>;

  if (!data) return (
    <main className="min-h-screen bg-[#f5f6f2] px-5 py-10 text-[#173a36]"><div className="mx-auto max-w-md"><Link href="/" className="text-sm text-[#54736b]">← basarens.com</Link>
      <div className="mt-20 rounded-3xl border border-[#e2e8df] bg-white p-8 shadow-sm"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#6b8a80]">Alleen op dit apparaat</p><h1 className="mt-3 text-4xl font-semibold tracking-tight">Finance<span className="text-[#b7c88b]">.</span></h1>
        <p className="mt-3 text-sm leading-relaxed text-[#5d746d]">{vault ? "Open je versleutelde Finance-kluis." : "Maak een versleutelde Finance-kluis in deze browser."} Je bankgegevens worden niet naar de website verstuurd.</p>
        <form onSubmit={vault ? unlock : create} className="mt-8 space-y-4"><label className="block text-sm font-medium">Wachtzin<input className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3" type="password" minLength={vault ? 1 : 12} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={vault ? "current-password" : "new-password"} required /></label>
          {!vault && <label className="block text-sm font-medium">Herhaal de wachtzin<input className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3" type="password" minLength={12} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} autoComplete="new-password" required /></label>}
          <button disabled={busy} className="w-full rounded-xl bg-[#0e3b36] px-5 py-3 font-semibold text-white disabled:opacity-50">{busy ? "Even wachten…" : vault ? "Kluis openen" : "Kluis maken"}</button></form>
        {!vault && <div className="mt-8 border-t border-[#e2e8df] pt-6"><p className="mb-3 text-sm font-medium">Heb je al een versleutelde back-up?</p><p className="mb-3 text-xs text-[#6b8a80]">Vul hierboven de wachtzin van de back-up in en kies het bestand.</p><input type="file" accept=".json" aria-label="Back-up herstellen" onChange={restore} disabled={busy || !password} className="block w-full text-sm" /></div>}
        {message && <p role="status" className="mt-5 text-sm text-rose-700">{message}</p>}
        <p className="mt-6 text-xs leading-relaxed text-[#71877f]">Bewaar je wachtzin en maak na elke import een back-up. Zonder wachtzin kunnen we de gegevens niet herstellen. Voor twee apparaten is een aparte back-up nodig.</p>
      </div></div></main>
  );

  return (
    <main className="min-h-screen bg-[#f5f6f2] text-[#173a36]">
      <div className="mx-auto max-w-6xl px-5 py-7 sm:px-9">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[#dfe6dc] pb-6">
          <div>
            <Link href="/" className="text-xs text-[#6c877e]">← basarens.com</Link>
            <p className="mt-2 text-2xl font-semibold">Finance<span className="text-[#b7c88b]">.</span></p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={downloadBackup} className="rounded-full border border-[#ccdbd0] px-4 py-2 text-sm">Download back-up</button>
            <button onClick={() => { setKey(null); setData(null); setMessage(""); }} className="rounded-full border border-[#ccdbd0] px-4 py-2 text-sm">Vergrendel</button>
          </div>
        </header>
        <div className="mt-10">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#789187]">Privé op dit apparaat</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight">Goed zicht op jullie geld.</h1>
        </div>
        <FinanceInsights transactions={data.transactions} accounts={data.accounts} />
        <section className="mt-8 rounded-2xl border border-[#e2e8df] bg-white p-6">
          <h2 className="text-xl font-semibold">Spaardoelen</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {data.goals.map((goal) => (
              <div key={goal.id} className="rounded-xl bg-[#f5f7f2] p-4">
                <p className="font-medium">{goal.label}</p>
                <p className="mt-1 text-sm text-[#71877f]">Doel: {euro(goal.target_cents)}</p>
              </div>
            ))}
          </div>
          <form onSubmit={addGoal} className="mt-5 flex flex-wrap gap-2">
            <input name="label" placeholder="Nieuw doel" aria-label="Naam spaardoel" required maxLength={80} className="min-w-0 flex-1 rounded-xl border border-[#e2e8df] px-3 py-2 text-sm" />
            <input name="target" placeholder="Bedrag in €" aria-label="Doelbedrag" required inputMode="decimal" className="w-36 rounded-xl border border-[#e2e8df] px-3 py-2 text-sm" />
            <button className="rounded-xl bg-[#dbe9d9] px-4 py-2 text-sm font-medium">Doel toevoegen</button>
          </form>
        </section>
        <section className="mt-8 rounded-2xl border border-[#e2e8df] bg-white p-6">
          <h2 className="text-xl font-semibold">Bankbestand importeren</h2>
          <p className="mt-2 mb-5 text-sm text-[#71877f]">Gebruik een CSV- of XLSX-export. Het bestand wordt in deze browser verwerkt en niet naar de server gestuurd.</p>
          <input type="file" accept=".csv,.xlsx" aria-label="Bankbestand importeren" onChange={importFile} disabled={busy} className="block w-full text-sm" />
          {message && <p role="status" className="mt-4 text-sm text-[#355c50]">{message}</p>}
        </section>
      </div>
    </main>
  );
}
