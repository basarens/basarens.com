"use client";

import { type FormEvent, useEffect, useRef, useState } from "react";
import styles from "./memories-archive.module.css";
import { EMPTY_PHOTO_DATE, formatPhotoDate, readPhotoDate, type PhotoDate } from "@/lib/memories/files";
import { MemoriesDateFields } from "./memories-date-fields";

type ArchivePhoto = PhotoDate & { id: string; filename: string; name: string; message: string; created_at: string; url: string | null; votes: number; voted: boolean };
type ArchivePage = { photos: ArchivePhoto[]; total: number; nextOffset: number | null; owner: boolean };

type PhotoContext = Pick<ArchivePhoto, "id" | "name" | "message" | "photo_year" | "photo_month" | "photo_day">;

function PhotoCard({ photo, onUpdate, trash, onRemoval }: { photo: ArchivePhoto; onUpdate: (photo: PhotoContext) => void; trash: boolean; onRemoval: () => void }) {
  const [failed, setFailed] = useState(false);
  const [flipped, setFlipped] = useState(false);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(photo.name);
  const [message, setMessage] = useState(photo.message);
  const [photoDate, setPhotoDate] = useState(readPhotoDate(photo) ?? EMPTY_PHOTO_DATE);
  const [baseline, setBaseline] = useState({ name: photo.name, message: photo.message, date: readPhotoDate(photo) ?? EMPTY_PHOTO_DATE });
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
    const date = readPhotoDate(photo) ?? EMPTY_PHOTO_DATE;
    setPhotoDate(date);
    setBaseline({ name: photo.name, message: photo.message, date });
    setNotice(""); setError(""); setConflict(null); setEditing(true);
  }
  async function removal() {
    if (saving.current) return;
    saving.current = true; setBusy(true); setError(""); setNotice("");
    try {
      const response = await fetch("/api/memories/removal", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: photo.id, action: trash ? "restore" : photo.voted ? "withdraw" : "vote" }), signal: AbortSignal.timeout(30000) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "De wijziging is niet gelukt.");
      setNotice(data.voted ? "Je verwijderstem is opgeslagen." : "Opgeslagen.");
      onRemoval();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Probeer opnieuw."); }
    finally { saving.current = false; setBusy(false); }
  }
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving.current || conflict) return;
    if (!readPhotoDate(photoDate)) { setError("Controleer de datum: vul een geldig jaar in en alleen een dag die in die maand bestaat."); return; }
    saving.current = true; setBusy(true); setError(""); setNotice("");
    try {
      const response = await fetch("/api/memories", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: photo.id, name, message, ...photoDate, previousDate: baseline.date, previousName: baseline.name, previousMessage: baseline.message }),
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
          <span className={styles.frontCaption}>
            <span className={styles.frontStory}>{photo.message.trim() || "Nog geen context"}</span>
            <span className={styles.frontMeta}><span>{formatPhotoDate(readPhotoDate(photo) ?? EMPTY_PHOTO_DATE)}</span><span aria-hidden="true">↻</span></span>
          </span>
        </button>
        {!trash && <button className={styles.frontVote} type="button" disabled={busy} aria-pressed={photo.voted} aria-label={`${photo.voted ? "Mijn verwijderstem intrekken" : "Stem om te verwijderen"}: ${photo.votes ?? 0} van 2 stemmen`} title="Bij twee verschillende accounts gaat deze foto naar de prullenbak" onClick={removal}>{busy ? "Opslaan…" : photo.voted ? "Intrekken" : "Verwijderstem"} · {photo.votes ?? 0}/2</button>}
        {!trash && (error || notice) && <div className={styles.frontFeedback} role="status" aria-live="polite">{error || notice}</div>}
      </div>
      <div className={`${styles.face} ${styles.back}`} inert={!flipped} aria-hidden={!flipped}>
        <div className={styles.backHeading}><span>Het verhaal achter de foto</span><button ref={backButton} type="button" disabled={busy} onClick={() => flip(false)}>Foto ↻</button></div>
        {editing ? <form onSubmit={save} className={styles.editForm}>
          <label htmlFor={`photographer-${photo.id}`}>Fotograaf<input id={`photographer-${photo.id}`} value={name} maxLength={80} disabled={busy} placeholder="Wie maakte deze foto?" onChange={(event) => setName(event.target.value)} /></label>
          <label htmlFor={`context-${photo.id}`}>Context<textarea id={`context-${photo.id}`} value={message} maxLength={1200} disabled={busy} rows={4} placeholder="Waar was dit? Wat gebeurde er?" onChange={(event) => setMessage(event.target.value)} /></label>
          <MemoriesDateFields value={photoDate} onChange={setPhotoDate} disabled={busy} />
          <p className={styles.editNote}>Wijzigingen zijn zichtbaar voor alle goedgekeurde vrienden.</p>
          <div className={styles.editActions}><button className={styles.saveButton} type="submit" disabled={busy || !!conflict}>{busy ? "Opslaan…" : "Opslaan"}</button><button type="button" disabled={busy} onClick={() => { setEditing(false); setError(""); setConflict(null); }}>Annuleren</button></div>
        </form> : <div className={styles.contextRead}>
          <p className={styles.fieldLabel}>Fotograaf</p><p className={styles.author}>{photo.name || "Nog onbekend. Weet jij wie het was?"}</p>
          <p className={styles.fieldLabel}>Context</p><p className={styles.contextStory}>{photo.message || "Hier ontbreekt het verhaal nog. Vul jij het aan?"}</p>
          <p className={styles.fieldLabel}>Datum van de foto</p><p className={styles.author}>{formatPhotoDate(readPhotoDate(photo) ?? EMPTY_PHOTO_DATE)}</p>
          {!trash && <button className={styles.editButton} type="button" disabled={busy} onClick={edit}>Context, fotograaf of datum aanpassen</button>}
        </div>}
        {!editing && <div className={styles.removal}><p>{trash ? "Verwijderd uit het archief. Alleen Bas kan deze foto nog zien en terugzetten." : `${photo.votes ?? 0}/2 verwijderstemmen. Bij twee verschillende accounts gaat deze foto uit het archief.`}</p><button type="button" disabled={busy} aria-pressed={!trash && photo.voted} onClick={removal}>{busy ? "Even opslaan…" : trash ? "Foto terugzetten" : photo.voted ? "Mijn verwijderstem intrekken" : "Stem om te verwijderen"}</button></div>}
        <div className={styles.feedback} aria-live="polite" role="status">{error && <p className={styles.cardError}>{error}</p>}{notice && <p>{notice}</p>}{conflict && <button type="button" onClick={() => { onUpdate(conflict); setConflict(null); setError(""); setEditing(false); setNotice("Dit is de nieuwste context. Je kunt opnieuw aanpassen."); }}>Nieuwste context bekijken</button>}</div>
        {!editing && <div className={styles.details}><span>Ingestuurd {new Date(photo.created_at).toLocaleDateString("nl-NL", { timeZone: "Europe/Amsterdam", day: "numeric", month: "short", year: "numeric" })}</span>{photo.url && <a href={photo.url} target="_blank" rel="noreferrer">Originele foto ↗</a>}</div>}
      </div>
    </div>
  </li>;
}

export function MemoriesArchive({ revision }: { revision: number }) {
  const [archive, setArchive] = useState<ArchivePage | null>(null);
  const [error, setError] = useState("");
  const [loadingMore, setLoadingMore] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("latest");
  const [trash, setTrash] = useState(false);
  const [shuffleSeed, setShuffleSeed] = useState("");
  const searchQuery = search.trim();
  const generation = useRef(0);
  const moreBusy = useRef(false);

  async function fetchPage(offset: number, signal?: AbortSignal): Promise<ArchivePage> {
    const response = await fetch(`/api/memories?offset=${offset}&search=${encodeURIComponent(searchQuery)}&sort=${sort}&seed=${shuffleSeed}&trash=${trash}`, {
      cache: "no-store",
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
    const start = setTimeout(() => { fetch(`/api/memories?offset=0&search=${encodeURIComponent(searchQuery)}&sort=${sort}&seed=${shuffleSeed}&trash=${trash}`, { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Het archief kon niet worden geladen.");
        if (active && current === generation.current) { setArchive(data); setError(""); setLoadingMore(false); }
      })
      .catch((reason) => {
        if (active && current === generation.current) { setError(reason.name === "AbortError" ? "Het laden duurt te lang. Probeer opnieuw." : reason.message); setLoadingMore(false); }
      }); }, 250);
    return () => { active = false; clearTimeout(start); clearTimeout(timeout); controller.abort(); };
  }, [revision, refresh, searchQuery, sort, shuffleSeed, trash]);

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
    {(archive?.owner || trash) && <button type="button" onClick={() => { setTrash(!trash); setArchive(null); setError(""); }}>{trash ? "Terug naar het archief" : "Prullenbak bekijken"}</button>}
    <div className={styles.heading}><div><p className={styles.eyebrow}>Het gedeelde fotoarchief</p><h2 id="archive-title">{trash ? "Prullenbak" : "Met context!"}</h2><p>{trash ? "Deze foto's zijn uit het gedeelde archief gehaald. Draai een foto om om deze terug te zetten." : "Tik op een foto voor het verhaal. Goedgekeurde vrienden kunnen context, fotograaf en datum aanvullen."}</p></div><button type="button" onClick={() => setRefresh((value) => value + 1)}>Vernieuwen ↻</button></div>
    <form className={styles.search} role="search" onSubmit={(event) => { event.preventDefault(); setRefresh((value) => value + 1); }}>
      <label htmlFor="archive-search">Zoek op context of fotograaf</label>
      <div><input id="archive-search" type="search" inputMode="search" maxLength={100} value={search} placeholder="Bijvoorbeeld Gent, Bas of Willem" onChange={(event) => { const value = event.target.value; if (value.trim() !== searchQuery) { setArchive(null); setError(""); } setSearch(value); }} />{search && <button type="button" onClick={() => { setSearch(""); setArchive(null); setError(""); }}>Wis zoekopdracht</button>}</div>
    </form>
    <div className={styles.sortControls}>
      <label htmlFor="archive-sort">Sorteer op<select id="archive-sort" value={sort} onChange={(event) => { setSort(event.target.value); if (event.target.value === "shuffle") setShuffleSeed(Array.from(crypto.getRandomValues(new Uint8Array(12)), (byte) => byte.toString(16).padStart(2, "0")).join("")); setArchive(null); setError(""); }}><option value="latest">Laatst toegevoegd</option><option value="date">Datum van de foto</option><option value="shuffle">Shuffle</option></select></label>
      {sort === "shuffle" && <button type="button" onClick={() => { setShuffleSeed(Array.from(crypto.getRandomValues(new Uint8Array(12)), (byte) => byte.toString(16).padStart(2, "0")).join("")); setArchive(null); setError(""); }}>Opnieuw shuffelen ↻</button>}
      {sort === "date" && <p>Nieuwste fotodatum eerst. Foto’s zonder datum staan onderaan.</p>}
    </div>
    <div role="status" aria-live="polite">{error ? <p className={styles.error}>{error} <button type="button" onClick={() => setRefresh((value) => value + 1)}>Opnieuw proberen</button></p> : !archive ? <p>{searchQuery ? "Even zoeken in het hele archief…" : "Even het bewijsmateriaal ophalen…"}</p> : <p className={styles.count}>{archive.total} foto{archive.total === 1 ? "" : "’s"} {searchQuery ? `gevonden voor “${searchQuery}”` : "in het archief"}</p>}</div>
    {archive?.photos.length === 0 && <div className={styles.empty}><p>{searchQuery ? "Geen foto’s gevonden." : trash ? "De prullenbak is leeg." : "Nog geen bewijsmateriaal."}</p><span>{searchQuery ? "Probeer een andere plaats, naam of een stukje van het verhaal." : trash ? "Bij twee verwijderstemmen verschijnt de foto hier." : "Wie durft de eerste foto in te sturen?"}</span>{!searchQuery && !trash && <a href="#upload-title">Foto’s toevoegen ↓</a>}</div>}
    {!!archive?.photos.length && <ul className={styles.grid}>{archive.photos.map((photo) => <PhotoCard key={`${photo.id}-${photo.url}`} photo={photo} trash={trash} onRemoval={() => setRefresh((value) => value + 1)} onUpdate={(updated) => setArchive((current) => current ? { ...current, photos: current.photos.map((item) => item.id === updated.id ? { ...item, ...updated } : item) } : current)} />)}</ul>}
    {archive?.nextOffset != null && <button className={styles.more} type="button" disabled={loadingMore} onClick={loadMore}>{loadingMore ? "Even ophalen…" : "Meer foto’s bekijken ↓"}</button>}
  </section>;
}
