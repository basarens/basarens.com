"use client";

import { useEffect, useRef, useState } from "react";
import { photoType, validPhoto } from "@/lib/memories/files";
import styles from "./memories-upload.module.css";
import { MemoriesArchive } from "./memories-archive";

type Photo = { id: string; file: File; type: string; status: "ready" | "sending" | "sent" | "error"; error?: string; uploadId?: string };

function Preview({ file }: { file: File }) {
  const imageRef = useRef<HTMLImageElement>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const preview = URL.createObjectURL(file);
    if (imageRef.current) imageRef.current.src = preview;
    return () => URL.revokeObjectURL(preview);
  }, [file]);
  if (failed) return <div className={styles.placeholder}>Foto geselecteerd<span>{file.name}</span></div>;
  // Local previews only; HEIC may not be displayable in every browser.
  // eslint-disable-next-line @next/next/no-img-element
  return <img ref={imageRef} alt={file.name} onError={() => setFailed(true)} />;
}

export function MemoriesUpload({ token, configured, featuredVideoUrl, featuredPhotoUrl }: { token: string; configured: boolean; featuredVideoUrl?: string; featuredPhotoUrl?: string }) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [archiveRevision, setArchiveRevision] = useState(0);
  const busyRef = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const sent = photos.filter((photo) => photo.status === "sent").length;
  const waiting = photos.filter((photo) => photo.status !== "sent").length;

  function selectFiles(files: FileList | null) {
    if (!files || busyRef.current) return;
    const selected: Photo[] = [];
    let skipped = 0;
    for (const file of Array.from(files)) {
      const type = photoType(file.name, file.type);
      if (!type || !validPhoto(file.size, type) || photos.length + selected.length >= 20) { skipped++; continue; }
      // LAN previews use HTTP, where randomUUID is unavailable on mobile browsers.
      const id = Array.from(crypto.getRandomValues(new Uint8Array(16)), (byte) => byte.toString(16).padStart(2, "0")).join("");
      selected.push({ id, file, type, status: "ready" });
    }
    setPhotos((current) => [...current, ...selected]);
    setNotice(skipped ? `${skipped} bestand(en) niet toegevoegd. Kies maximaal 20 foto’s van elk maximaal 20 MB, als JPG, PNG, WEBP of HEIC.` : "");
    if (inputRef.current) inputRef.current.value = "";
  }

  async function api(body: object) {
    const response = await fetch("/api/memories", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(30000),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Het insturen is niet gelukt. Probeer opnieuw.");
    return data;
  }

  async function send() {
    if (busyRef.current || !configured) return;
    busyRef.current = true;
    setBusy(true);
    setNotice("");
    let succeeded = 0;
    let failed = 0;
    try {
      for (const photo of photos.filter((item) => item.status !== "sent")) {
        setPhotos((current) => current.map((item) => item.id === photo.id ? { ...item, status: "sending", error: undefined } : item));
        try {
          let uploadId = photo.uploadId;
          if (!uploadId) {
            const upload = await api({ action: "prepare", filename: photo.file.name, type: photo.type, size: photo.file.size, name, message });
            const response = await fetch(upload.uploadUrl, {
              method: "PUT", headers: { "Content-Type": photo.type }, body: photo.file,
              signal: AbortSignal.timeout(180000),
            });
            if (!response.ok) throw new Error("Deze foto kon niet worden verstuurd. Probeer opnieuw.");
            uploadId = upload.id;
            setPhotos((current) => current.map((item) => item.id === photo.id ? { ...item, uploadId } : item));
          }
          await api({ action: "complete", id: uploadId });
          succeeded++;
          setPhotos((current) => current.map((item) => item.id === photo.id ? { ...item, status: "sent" } : item));
        } catch (error) {
          failed++;
          const detail = error instanceof Error && error.name !== "TimeoutError" ? error.message : "Geen verbinding of de upload duurde te lang. Probeer opnieuw.";
          setPhotos((current) => current.map((item) => item.id === photo.id ? { ...item, status: "error", error: detail } : item));
        }
      }
      setNotice(failed ? `${succeeded} foto’s ontvangen; ${failed} nog niet bevestigd. Je kunt die opnieuw proberen.` : "Alles binnen. Bedankt voor het bewijsmateriaal!");
      if (succeeded) setArchiveRevision((value) => value + 1);
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.header}><span className={styles.brand}>bas arens<span> / herinneringen</span></span><span className={styles.badge}>Van jou, voor Bas</span></header>
        <section className={styles.intro}>
          <div><p className={styles.eyebrow}>Het fotoarchief dat Bas zelf niet heeft.</p><h1>De mooiste momenten maak je samen <em>met Bas</em></h1><p className={styles.friends}>en Ruben, en Willem, en Jord.</p><p className={styles.lead}>Vakanties, slechte dansmoves en avonden met een goed verhaal. Heb jij de foto’s nog? Stuur ze door. Ook als ik er minder charmant op sta.</p></div>
          <div className={styles.art}>
            <div className={styles.backCard} aria-hidden="true">
              {/* eslint-disable-next-line @next/next/no-img-element -- Keep the private signed photo outside the shared image optimization cache. */}
              {featuredPhotoUrl && <img className={styles.featuredPhoto} src={featuredPhotoUrl} alt="" />}
              <span className={styles.backCaption}>Dit leek toen een goed idee.</span>
            </div>
            <figure className={styles.frontCard}>
              {featuredVideoUrl ? (
                <video className={styles.featuredMedia} autoPlay loop muted controls playsInline preload="auto" aria-label="Video van Bas: Ja, ik kom niet nuchter thuis">
                  <source src={featuredVideoUrl} type="video/mp4" />
                  Je browser kan deze video niet afspelen. <a href={featuredVideoUrl}>Open de video</a>.
                </video>
              ) : (
                <div className={styles.videoPlaceholder}><span>Video komt hier.</span><small>Het bewijs is onderweg.</small></div>
              )}
              <figcaption className={styles.videoCaption}>Ja, ik kom niet nuchter thuis</figcaption>
            </figure>
          </div>
        </section>
        <section className={styles.panel} aria-labelledby="upload-title">
          <div className={styles.panelHeading}><div><p className={styles.eyebrow}>Tijd om je camerarol door te spitten</p><h2 id="upload-title">Heb jij nog bewijsmateriaal?</h2></div><span>Geen account nodig</span></div>
          {!configured && <p className={styles.warning} role="status">Het insturen staat nog niet aan. Je kunt alvast foto’s kiezen, maar ze worden nog niet opgeslagen. Kom later terug om ze te versturen.</p>}
          <div className={styles.dropzone} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); selectFiles(event.dataTransfer.files); }}>
            <span className={styles.plus} aria-hidden="true">＋</span><h3>Ja, ook die ene foto.</h3><p>Kies foto’s op je telefoon, of sleep ze hierheen.</p>
            <button className={styles.choose} type="button" disabled={busy} onClick={() => inputRef.current?.click()}>Foto’s kiezen <span aria-hidden="true">↗</span></button>
            <input ref={inputRef} type="file" multiple accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif" hidden onChange={(event) => selectFiles(event.target.files)} />
            <small>JPG, PNG, WEBP of HEIC · max. 20 MB per foto · 20 tegelijk</small>
          </div>
          {photos.length > 0 && <><div className={styles.selectionHeading}><span>{photos.length} foto’s geselecteerd</span><span>{sent} ontvangen</span></div><ul className={styles.photos}>{photos.map((photo) => <li key={photo.id}><div className={styles.thumbnail}><Preview file={photo.file} />{photo.status !== "sent" && <button type="button" aria-label={`Verwijder ${photo.file.name}`} disabled={busy} onClick={() => setPhotos((current) => current.filter((item) => item.id !== photo.id))}>×</button>}</div><p className={styles.filename} title={photo.file.name}>{photo.file.name}</p><p className={photo.status === "error" ? styles.error : styles.photoStatus}>{photo.status === "sent" ? "✓ Ontvangen" : photo.status === "sending" ? "Wordt verstuurd…" : photo.status === "error" ? photo.error : "Klaar om te versturen"}</p></li>)}</ul></>}
          <div className={styles.fields}><label>Wie moeten we hiervoor bedanken? <span>optioneel</span><input value={name} maxLength={80} disabled={busy} autoComplete="name" placeholder="Je naam" onChange={(event) => setName(event.target.value)} /></label><label>Wat gebeurde hier? <span>optioneel</span><textarea value={message} maxLength={1200} disabled={busy} rows={3} placeholder="Waar waren we? Wanneer was dit? En wat dacht ik hier te doen?" onChange={(event) => setMessage(event.target.value)} /></label></div>
          <div className={styles.sendRow}><p>Je foto’s, naam en verhaal komen in het gedeelde archief.<br />Iedereen met deze link kan ze bekijken.</p><button className={styles.send} type="button" disabled={busy || !waiting || !configured} onClick={send}>{busy ? "Even versturen…" : sent && !waiting ? "Alles ontvangen ✓" : `Verstuur${waiting ? ` ${waiting} foto${waiting === 1 ? "" : "’s"}` : " je foto’s"}`} <span aria-hidden="true">→</span></button></div>
          <p className={styles.notice} role="status" aria-live="polite">{notice}</p>
          {sent > 0 && !waiting && <button className={styles.more} type="button" onClick={() => { setPhotos([]); setMessage(""); setNotice(""); inputRef.current?.click(); }}>Er is meer bewijsmateriaal</button>}
        </section>
        <MemoriesArchive token={token} revision={archiveRevision} />
        <footer className={styles.footer}><span>Goed gezelschap. Matige beslissingen.</span><span>Het archief van Bas · basarens.com</span></footer>
      </div>
    </main>
  );
}
