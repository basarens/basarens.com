"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./memories-archive.module.css";

type ArchivePhoto = { id: string; filename: string; name: string; message: string; created_at: string; url: string | null };
type ArchivePage = { photos: ArchivePhoto[]; total: number; nextOffset: number | null };

function PhotoCard({ photo }: { photo: ArchivePhoto }) {
  const [failed, setFailed] = useState(false);
  return <li className={styles.card}>
    <div className={styles.image}>
      {photo.url && !failed ? (
        <a href={photo.url} target="_blank" rel="noreferrer" aria-label={`Bekijk ${photo.filename} op volledig formaat`}>
          {/* Signed private originals; no public image optimizer/cache. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photo.url} alt={photo.message || photo.filename} loading="lazy" referrerPolicy="no-referrer" onError={() => setFailed(true)} />
        </a>
      ) : <p>Geen fotovoorbeeld beschikbaar.{photo.url && <a href={photo.url} target="_blank" rel="noreferrer">Open het originele bestand ↗</a>}</p>}
    </div>
    <div className={styles.caption}>
      <p className={styles.author}>{photo.name || "Een anonieme fotograaf"}</p>
      {photo.message && <p className={styles.story}>{photo.message}</p>}
      <div className={styles.details}><span>Ingestuurd {new Date(photo.created_at).toLocaleDateString("nl-NL", { timeZone: "Europe/Amsterdam", day: "numeric", month: "short", year: "numeric" })}</span>{photo.url && <a href={photo.url} target="_blank" rel="noreferrer">Origineel ↗</a>}</div>
    </div>
  </li>;
}

export function MemoriesArchive({ token, revision }: { token: string; revision: number }) {
  const [archive, setArchive] = useState<ArchivePage | null>(null);
  const [error, setError] = useState("");
  const [loadingMore, setLoadingMore] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const generation = useRef(0);
  const moreBusy = useRef(false);

  async function fetchPage(offset: number, signal?: AbortSignal): Promise<ArchivePage> {
    const response = await fetch(`/api/memories?offset=${offset}`, {
      headers: { Authorization: `Bearer ${token}` }, cache: "no-store",
      signal: signal ?? AbortSignal.timeout(30000),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Het archief kon niet worden geladen.");
    return data;
  }

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);
    const current = ++generation.current;
    moreBusy.current = false;
    fetch(`/api/memories?offset=0`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Het archief kon niet worden geladen.");
        if (active && current === generation.current) { setArchive(data); setError(""); setLoadingMore(false); }
      })
      .catch((reason) => {
        if (active && current === generation.current) { setError(reason.name === "AbortError" ? "Het laden duurt te lang. Probeer opnieuw." : reason.message); setLoadingMore(false); }
      });
    return () => { active = false; clearTimeout(timeout); controller.abort(); };
  }, [token, revision, refresh]);

  async function loadMore() {
    if (moreBusy.current || archive?.nextOffset == null) return;
    moreBusy.current = true;
    setLoadingMore(true);
    const current = generation.current;
    try {
      const data = await fetchPage(archive.nextOffset);
      if (current !== generation.current) return;
      setArchive((previous) => ({ ...data, photos: [...(previous?.photos ?? []), ...data.photos.filter((photo) => !previous?.photos.some((old) => old.id === photo.id))] }));
      setError("");
    } catch (reason) {
      if (current === generation.current) setError(reason instanceof Error ? reason.message : "Laden is niet gelukt. Probeer opnieuw.");
    } finally {
      if (current === generation.current) { moreBusy.current = false; setLoadingMore(false); }
    }
  }

  return <section id="archief" className={styles.archive} aria-labelledby="archive-title">
    <div className={styles.heading}><div><p className={styles.eyebrow}>Het gedeelde fotoarchief</p><h2 id="archive-title">Dit leek toen een goed idee.</h2><p>Alle foto’s en verhalen, voor iedereen met deze link.</p></div><button type="button" onClick={() => setRefresh((value) => value + 1)}>Vernieuwen ↻</button></div>
    <div role="status" aria-live="polite">{error ? <p className={styles.error}>{error} <button type="button" onClick={() => setRefresh((value) => value + 1)}>Opnieuw proberen</button></p> : !archive ? <p>Even het bewijsmateriaal ophalen…</p> : <p className={styles.count}>{archive.total} foto{archive.total === 1 ? "" : "’s"} in het archief</p>}</div>
    {archive?.photos.length === 0 && <div className={styles.empty}><p>Nog geen bewijsmateriaal.</p><span>Wie durft de eerste foto in te sturen?</span><a href="#upload-title">Foto’s toevoegen ↓</a></div>}
    {!!archive?.photos.length && <ul className={styles.grid}>{archive.photos.map((photo) => <PhotoCard key={`${photo.id}-${photo.url}`} photo={photo} />)}</ul>}
    {archive?.nextOffset != null && <button className={styles.more} type="button" disabled={loadingMore} onClick={loadMore}>{loadingMore ? "Even ophalen…" : "Meer foto’s bekijken ↓"}</button>}
  </section>;
}
