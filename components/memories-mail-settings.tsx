"use client";
import { useEffect, useState } from "react";
import styles from "./memories-mail-settings.module.css";
export function MemoriesMailSettings() {
  const [settings, setSettings] = useState<{ enabled: boolean; owner: boolean; ready: boolean } | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/memories/mail-preferences", { cache: "no-store", signal: controller.signal }).then(async (response) => {
      if (!response.ok) throw new Error("De mailinstelling kon niet worden geladen.");
      setSettings(await response.json());
    }).catch((reason) => { if (reason.name !== "AbortError") setNotice(reason.message); });
    return () => controller.abort();
  }, []);
  async function change() {
    if (!settings || busy) return;
    setBusy(true); setNotice("");
    try {
      const response = await fetch("/api/memories/mail-preferences", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ enabled: !settings.enabled }), signal: AbortSignal.timeout(15000) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Opslaan is niet gelukt.");
      setSettings({ ...settings, enabled: result.enabled });
      setNotice(result.enabled ? "Je ontvangt weer herinneringsmails." : "De herinneringsmails staan uit.");
    } catch (reason) { setNotice(reason instanceof Error ? reason.message : "Opslaan is niet gelukt."); }
    finally { setBusy(false); }
  }
  return <details className={styles.settings}><summary>Herinneringen in je inbox</summary><p>Elke maand maximaal vier foto’s uit dezelfde maand in eerdere jaren. Alleen als er passende foto’s zijn.</p><p className={styles.note}>De uitgelichte foto’s staan in de mail. Het volledige archief blijft achter jullie accounts.</p>{settings ? <><p>{settings.ready ? (settings.enabled ? "Herinneringsmails staan aan voor jouw account." : "Herinneringsmails staan uit voor jouw account.") : "De automatische herinneringsmails worden binnenkort ingeschakeld."}</p><button type="button" disabled={busy} onClick={change}>{busy ? "Opslaan…" : settings.enabled ? "Herinneringsmails uitzetten" : "Herinneringsmails aanzetten"}</button>{settings.owner && <a href="/api/memories/monthly/preview" target="_blank" rel="noreferrer">Bekijk voorbeeldmail ↗</a>}</> : !notice && <p>Even ophalen…</p>}<p role="status" aria-live="polite">{notice}</p></details>;
}
