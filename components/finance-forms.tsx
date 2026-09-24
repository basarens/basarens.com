"use client";

import { useActionState } from "react";
import { importFinanceFile, signInFinance, type FinanceFormState } from "@/app/finance/actions";

const initial: FinanceFormState = { message: "" };

export function FinanceLogin() {
  const [state, action, pending] = useActionState(signInFinance, initial);
  return (
    <form action={action} className="mt-8 space-y-4">
      <label className="block text-sm font-medium">E-mailadres<input className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900" name="email" type="email" autoComplete="email" required /></label>
      <label className="block text-sm font-medium">Wachtwoord<input className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900" name="password" type="password" autoComplete="current-password" required /></label>
      {state.message && <p role="alert" className="text-sm text-rose-600">{state.message}</p>}
      <button disabled={pending} className="w-full rounded-xl bg-[#0e3b36] px-5 py-3 font-semibold text-white disabled:opacity-50">{pending ? "Even wachten…" : "Inloggen"}</button>
    </form>
  );
}

export function FinanceImport() {
  const [state, action, pending] = useActionState(importFinanceFile, initial);
  return (
    <form action={action} className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <label className="flex-1 text-sm font-medium">Bankexport (CSV of XLSX)<input className="mt-2 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" name="file" type="file" accept=".csv,.xlsx" required /></label>
      <button disabled={pending} className="rounded-xl bg-[#0e3b36] px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">{pending ? "Importeren…" : "Importeer bestand"}</button>
      {state.message && <p role="status" className={`text-sm sm:basis-full ${state.success ? "text-emerald-700" : "text-rose-600"}`}>{state.message}</p>}
    </form>
  );
}
