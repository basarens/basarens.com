"use client";

import { useState, type FormEvent } from "react";

export function MemoriesLogin() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/memories/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: sent ? "verify" : "send", email, code }), signal: AbortSignal.timeout(30000) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Inloggen lukt nu niet.");
      if (sent) window.location.replace("/herinneringen");
      else { setSent(true); setMessage(data.message); }
    } catch (error) { setMessage(error instanceof Error ? error.message : "Probeer opnieuw."); }
    finally { setBusy(false); }
  }
  const inputClass = "mt-2 w-full rounded-lg border border-[#29392e40] bg-[#fffdf8] p-3 text-base focus:outline-2 focus:outline-[#bb6046]";
  return <main className="grid min-h-screen place-items-center bg-[#f5efe5] px-6 py-12 text-[#29392e]">
    <div className="w-full max-w-md rounded-2xl bg-[#fffdf8] p-7">
      <p className="text-xs uppercase tracking-widest">Bas Arens · herinneringen</p>
      <h1 className="mt-5 text-4xl font-semibold tracking-tight">Alleen voor ons.</h1>
      <p className="mt-4 text-sm leading-relaxed">Log in met je eigen e-mailadres. Alleen vrienden die Bas heeft toegevoegd, kunnen het fotoarchief bekijken.</p>
      <form onSubmit={submit} className="mt-6 space-y-5">
        <label className="block text-sm">E-mailadres<input className={inputClass} type="email" autoComplete="email" required maxLength={254} value={email} disabled={busy || sent} onChange={(event) => setEmail(event.target.value)} /></label>
        {sent && <label className="block text-sm">Code uit je e-mail<input className={inputClass} type="text" inputMode="numeric" autoComplete="one-time-code" required pattern="[0-9]{6,10}" maxLength={10} value={code} disabled={busy} onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))} /></label>}
        <button className="w-full rounded-lg bg-[#29392e] p-3 text-sm text-white disabled:opacity-50" disabled={busy}>{busy ? "Even wachten…" : sent ? "Inloggen" : "Stuur mijn inlogcode"}</button>
        {sent && <button className="text-sm underline" type="button" disabled={busy} onClick={() => { setSent(false); setCode(""); setMessage(""); }}>Andere e-mail of opnieuw een code aanvragen</button>}
      </form>
      <p className="mt-4 text-sm leading-relaxed" role="status" aria-live="polite">{message}</p>
    </div>
  </main>;
}
