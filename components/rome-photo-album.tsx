"use client";

import { ChangeEvent, useState } from "react";

type Photo = {
  id: string;
  name: string;
  previewUrl: string;
  file: File;
};

export function RomePhotoAlbum() {
  const [photos, setPhotos] = useState<Photo[]>([]);

  function addPhotos(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    const newPhotos = files.map((file) => ({
      id: `${file.name}-${file.lastModified}-${crypto.randomUUID()}`,
      name: file.name,
      previewUrl: URL.createObjectURL(file),
      file,
    }));

    setPhotos((currentPhotos) => [...currentPhotos, ...newPhotos]);
    event.target.value = "";
  }

  function removePhoto(photo: Photo) {
    URL.revokeObjectURL(photo.previewUrl);
    setPhotos((currentPhotos) => currentPhotos.filter((currentPhoto) => currentPhoto.id !== photo.id));
  }

  function downloadPhoto(photo: Photo) {
    const link = document.createElement("a");
    link.href = photo.previewUrl;
    link.download = photo.file.name;
    link.click();
  }

  return (
    <div className="rounded-[2rem] bg-white/55 p-5 sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-5">
        <div>
          <p className="text-base font-medium">Het album begint hier.</p>
          <p className="mt-1 max-w-xl text-sm leading-relaxed text-[#b31c38]/70">
            Kies foto&apos;s op je telefoon of computer. Je ziet ze meteen terug als een klein reisalbum.
          </p>
        </div>
        <label className="inline-flex cursor-pointer items-center rounded-full bg-[#ce0f3d] px-5 py-3 text-sm font-medium text-white shadow-[4px_5px_0_#76142a] transition-transform hover:-translate-y-0.5 focus-within:outline-2 focus-within:outline-offset-4 focus-within:outline-[#ce0f3d]">
          <span aria-hidden="true" className="mr-2 text-lg leading-none">+</span>
          Foto&apos;s kiezen
          <input accept="image/*" className="sr-only" multiple onChange={addPhotos} type="file" />
        </label>
      </div>

      {photos.length === 0 ? (
        <div className="mt-8 grid min-h-52 place-items-center rounded-3xl border border-dashed border-[#b31c38]/30 bg-[#ffd2dd]/45 px-6 text-center">
          <div>
            <p className="text-4xl" aria-hidden="true">◌</p>
            <p className="mt-3 font-medium">Nog geen foto&apos;s — straks wel herinneringen.</p>
          </div>
        </div>
      ) : (
        <ul className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {photos.map((photo) => (
            <li className="group relative aspect-square overflow-hidden rounded-2xl bg-[#b31c38]" key={photo.id}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img alt={photo.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" src={photo.previewUrl} />
              <div className="absolute inset-x-0 bottom-0 flex translate-y-full items-center justify-between gap-2 bg-[#76142a]/90 p-3 text-white transition-transform duration-300 group-hover:translate-y-0 group-focus-within:translate-y-0">
                <button className="text-xs font-medium underline underline-offset-4" onClick={() => downloadPhoto(photo)} type="button">
                  Download
                </button>
                <button aria-label={`${photo.name} verwijderen`} className="text-xs text-[#ffd2dd]" onClick={() => removePhoto(photo)} type="button">
                  Verwijder
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-6 text-xs leading-relaxed text-[#b31c38]/60">
        Voor nu blijven toegevoegde foto&apos;s alleen op dit apparaat en kun je ze afzonderlijk downloaden. Voor een gedeeld album en één download voor iedereen koppelen we dit later aan opslag in de cloud.
      </p>
    </div>
  );
}
