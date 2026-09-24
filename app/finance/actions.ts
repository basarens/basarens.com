"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createFinanceClient, financeConfigured, getFinanceAccess } from "@/lib/finance/supabase";
import { parseBankFile } from "@/lib/finance/import";

export type FinanceFormState = { message: string; success?: boolean };

export async function signInFinance(
  _state: FinanceFormState,
  form: FormData,
): Promise<FinanceFormState> {
  if (!financeConfigured()) return { message: "Finance is nog niet verbonden met de privé-database." };
  const email = String(form.get("email") ?? "").trim();
  const password = String(form.get("password") ?? "");
  if (!email.includes("@") || !password) return { message: "Vul je e-mailadres en wachtwoord in." };
  const client = await createFinanceClient();
  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) return { message: "Inloggen is niet gelukt. Controleer je gegevens." };
  const { data: user } = await client.auth.getClaims();
  const { data: member } = await client.from("finance_members").select("user_id").eq("user_id", user?.claims?.sub ?? "").maybeSingle();
  if (!member) {
    await client.auth.signOut();
    return { message: "Dit account heeft geen toegang tot Finance." };
  }
  redirect("/finance");
}

export async function signOutFinance() {
  if (financeConfigured()) {
    const client = await createFinanceClient();
    await client.auth.signOut();
  }
  redirect("/finance");
}

export async function importFinanceFile(
  _state: FinanceFormState,
  form: FormData,
): Promise<FinanceFormState> {
  const access = await getFinanceAccess();
  if (!access) return { message: "Je sessie is verlopen. Log opnieuw in." };
  const file = form.get("file");
  if (!(file instanceof File) || !file.size) return { message: "Kies eerst een bankbestand." };
  try {
    const { transactions, accounts } = await parseBankFile(file);
    const { error: accountError } = await access.client.from("finance_accounts").upsert(
      accounts.map((iban) => ({ iban, label: `Rekening •••• ${iban.slice(-4)}` })),
      { onConflict: "iban", ignoreDuplicates: true },
    );
    if (accountError) throw accountError;
    let inserted = 0;
    for (let i = 0; i < transactions.length; i += 250) {
      const { data, error } = await access.client
        .from("finance_transactions")
        .upsert(transactions.slice(i, i + 250), { onConflict: "fingerprint", ignoreDuplicates: true })
        .select("fingerprint");
      if (error) throw error;
      inserted += data?.length ?? 0;
    }
    revalidatePath("/finance");
    return { message: `${inserted} nieuwe transacties geïmporteerd. ${transactions.length - inserted} stonden al in Finance.`, success: true };
  } catch (error) {
    console.error("Finance import failed", error instanceof Error ? error.message : "Unknown error");
    return { message: error instanceof Error && !/permission|relation|column|JWT/i.test(error.message)
      ? error.message
      : "Importeren is niet gelukt. Controleer de database-inrichting en het bankbestand." };
  }
}

export async function saveFinanceAccount(form: FormData) {
  const access = await getFinanceAccess();
  if (!access) throw new Error("Geen toegang");
  const iban = String(form.get("iban") ?? "");
  const kind = String(form.get("kind") ?? "");
  const owner = String(form.get("owner") ?? "");
  if (!/^[A-Z0-9]{8,34}$/.test(iban) || !["current", "savings"].includes(kind) || !["shared", "personal"].includes(owner)) {
    throw new Error("Ongeldige rekeninginstelling");
  }
  const { error } = await access.client.from("finance_accounts").update({ kind, owner }).eq("iban", iban);
  if (error) throw new Error("Rekening kon niet worden bijgewerkt");
  revalidatePath("/finance");
}

export async function saveFinanceGoal(form: FormData) {
  const access = await getFinanceAccess();
  if (!access) throw new Error("Geen toegang");
  const label = String(form.get("label") ?? "").trim().slice(0, 80);
  const amount = Number(String(form.get("target") ?? "").replace(",", "."));
  if (!label || !Number.isFinite(amount) || amount <= 0 || amount > 10_000_000) throw new Error("Ongeldig doel");
  const { error } = await access.client.from("finance_goals").insert({ label, target_cents: Math.round(amount * 100) });
  if (error) throw new Error("Doel kon niet worden opgeslagen");
  revalidatePath("/finance");
}
