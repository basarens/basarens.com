"use client";

import { type FormEvent, useEffect, useRef, useState } from "react";
import styles from "./memories-archive.module.css";

type ArchivePhoto = { id: string; filename: string; name: string; message: string; created_at: string; url: string | null };
type ArchivePage = { photos: ArchivePhoto[]; total: number; nextOffset: number | null };

type PhotoContext = Pick<ArchivePhoto, "id" | "name" | "message">;

function PhotoCard({ photo, token, onUpdate }: { photo: ArchivePhoto; token: string; onUpdate: (photo: PhotoContext) => void }) {
  const [failed, setFailed] = useState(false);
  const [flipped, setFlipped] = useState(false);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(photo.name);
  const [message, setMessage] = useState(photo.message);
  const [baseline, setBaseline] = useState({ name: photo.name, message: photo.message });
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [conflict, setConflict] = useState<PhotoContext | null>(null);
  const saving = useRef(false);
  const frontButton = useRef<HTMLButtonElement>(null);
  const backButton = useRef<HTMLButtonElement>(null);

  function flip(value: boolean) {
    setFlipped(value);
    if (!value) { setEditing(false); setError(""); setConflict(null); }
    requestAnimationFrame(() => (value ? backButton : frontButton).current?.focus({ preventScroll: true }));
  }
  function edit() {
    setName(photo.name); setMessage(photo.message);
    setBaseline({ name: photo.name, message: photo.message });
    setNotice(""); setError(""); setConflict(null); setEditing(true);
  }
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving.current || conflict) return;
    saving.current = true; setBusy(true); setError(""); setNotice("");
    try {
      const response = await fetch("/api/memories", {
        method: "PATCH", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id: photo.id, name, message, previousName: baseline.name, previousMessage: baseline.message }),
        signal: AbortSignal.timeout(30000),
      });
      const data = await response.json();
      if (!response.ok) {
        if (response.status === 409 && data.current) setConflict(data.current);
        throw new Error(data.error || "Opslaan is niet gelukt.");
      }
      onUpdate(data.photo); setEditing(false); setNotice("Opgeslagen. Iedereen ziet nu deze context.");
    } catch (reason) {
      setError(reason instanceof Error && reason.name !== "TimeoutError" ? reason.message : "Geen verbinding. Probeer opnieuw.");
    } finally { saving.current = false; setBusy(false); }
  }

  return <li className={styles.card}>
    <div className={`${styles.flipInner} ${flipped ? styles.flipped : ""}`}>
      <div className={`${styles.face} ${styles.front}`} inert={flipped} aria-hidden={flipped}>
        <button ref={frontButton} className={styles.frontButton} type="button" onClick={() => flip(true)} aria-label={`Draai foto ${photo.filename} om voor context`} aria-expanded={flipped}>
          <span className={styles.image}>
            {photo.url && !failed ? (
              // Signed private originals; no public optimizer/cache.
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photo.url} alt={photo.filename} loading="lazy" referrerPolicy="no-referrer" onError={() => setFailed(true)} />
            ) : <span className={styles.unavailable}>Geen fotovoorbeeld beschikbaar.<br />Tik om de context te bekijken.</span>}
          </span>
          <span className={styles.frontCaption}><span className={styles.author}>{photo.name || "Fotograaf onbekend"}</span><span className={styles.flipHint}>Bekijk context ↻</span></span>
        </button>
      </div>
      <div className={`${styles.face} ${styles.back}`} inert={!flipped} aria-hidden={!flipped}>
        <div className={styles.backHeading}><span>Het verhaal achter de foto</span><button ref={backButton} type="button" disabled={busy} onClick={() => flip(false)}>Foto ↻</button></div>
        {editing ? <form onSubmit={save} className={styles.editForm}>
          <label htmlFor={`photographer-${photo.id}`}>Fotograaf<input id={`photographer-${photo.id}`} value={name} maxLength={80} disabled={busy} placeholder="Wie maakte deze foto?" onChange={(event) => setName(event.target.value)} /></label>
          <label htmlFor={`context-${photo.id}`}>Context<textarea id={`context-${photo.id}`} value={message} maxLength={1200} disabled={busy} rows={4} placeholder="Waar was dit? Wat gebeurde er?" onChange={(event) => setMessage(event.target.value)} /></label>
          <p className={styles.editNote}>Wijzigingen zijn zichtbaar voor iedereen met de link.</p>
          <div className={styles.editActions}><button className={styles.saveButton} type="submit" disabled={busy || !!conflict}>{busy ? "Opslaan…" : "Opslaan"}</button><button type="button" disabled={busy} onClick={() => { setEditing(false); setError(""); setConflict(null); }}>Annuleren</button></div>
        </form> : <div className={styles.contextRead}>
          <p className={styles.fieldLabel}>Fotograaf</p><p className={styles.author}>{photo.name || "Nog onbekend. Weet jij wie het was?"}</p>
          <p className={styles.fieldLabel}>Context</p><p className={styles.contextStory}>{photo.message || "Hier ontbreekt het verhaal nog. Vul jij het aan?"}</p>
          <button className={styles.editButton} type="button" onClick={edit}>Context of fotograaf aanpassen</button>
        </div>}
        <div className={styles.feedback} aria-live="polite" role="status">{error && <p className={styles.cardError}>{error}</p>}{notice && <p>{notice}</p>}{conflict && <button type="button" onClick={() => { onUpdate(conflict); setConflict(null); setError(""); setEditing(false); setNotice("Dit is de nieuwste context. Je kunt opnieuw aanpassen."); }}>Nieuwste context bekijken</button>}</div>
        {!editing && <div className={styles.details}><span>Ingestuurd {new Date(photo.created_at).toLocaleDateString("nl-NL", { timeZone: "Europe/Amsterdam", day: "numeric", month: "short", year: "numeric" })}</span>{photo.url && <a href={photo.url} target="_blank" rel="noreferrer">Originele foto ↗</a>}</div>}
      </div>
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
    <div className={styles.heading}><div><p className={styles.eyebrow}>Het gedeelde fotoarchief</p><h2 id="archive-title">Dit leek toen een goed idee.</h2><p>Tik op een foto voor het verhaal. Iedereen met de link kan context en fotograaf aanvullen.</p></div><button type="button" onClick={() => setRefresh((value) => value + 1)}>Vernieuwen ↻</button></div>
    <div role="status" aria-live="polite">{error ? <p className={styles.error}>{error} <button type="button" onClick={() => setRefresh((value) => value + 1)}>Opnieuw proberen</button></p> : !archive ? <p>Even het bewijsmateriaal ophalen…</p> : <p className={styles.count}>{archive.total} foto{archive.total === 1 ? "" : "’s"} in het archief</p>}</div>
    {archive?.photos.length === 0 && <div className={styles.empty}><p>Nog geen bewijsmateriaal.</p><span>Wie durft de eerste foto in te sturen?</span><a href="#upload-title">Foto’s toevoegen ↓</a></div>}
    {!!archive?.photos.length && <ul className={styles.grid}>{archive.photos.map((photo) => <PhotoCard key={`${photo.id}-${photo.url}`} photo={photo} token={token} onUpdate={(updated) => setArchive((current) => current ? { ...current, photos: current.photos.map((item) => item.id === updated.id ? { ...item, ...updated } : item) } : current)} />)}</ul>}
    {archive?.nextOffset != null && <button className={styles.more} type="button" disabled={loadingMore} onClick={loadMore}>{loadingMore ? "Even ophalen…" : "Meer foto’s bekijken ↓"}</button>}
  </section>;
}
