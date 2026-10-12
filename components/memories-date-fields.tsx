"use client";

import { PHOTO_MONTHS, type PhotoDate } from "@/lib/memories/files";
import styles from "./memories-date-fields.module.css";

export function MemoriesDateFields({ value, onChange, disabled, batch = false }: { value: PhotoDate; onChange: (date: PhotoDate) => void; disabled?: boolean; batch?: boolean }) {
  return <fieldset className={styles.dateFields} disabled={disabled}>
    <legend>Wanneer was dit? <span>optioneel</span></legend>
    <div className={styles.row}>
      <label>Jaar<input type="text" inputMode="numeric" pattern="[0-9]*" maxLength={4} placeholder="Bijv. 2022" value={value.photo_year ?? ""} onChange={(event) => { if (/^\d*$/.test(event.target.value)) onChange(event.target.value ? { ...value, photo_year: Number(event.target.value) } : { photo_year: null, photo_month: null, photo_day: null }); }} /></label>
      <label>Maand<select value={value.photo_month ?? ""} disabled={disabled || !value.photo_year} onChange={(event) => onChange({ ...value, photo_month: event.target.value ? Number(event.target.value) : null, photo_day: null })}><option value="">Onbekend</option>{PHOTO_MONTHS.map((month, index) => <option value={index + 1} key={month}>{month}</option>)}</select></label>
      <label>Dag<input type="text" inputMode="numeric" pattern="[0-9]*" maxLength={2} placeholder="Bijv. 15" value={value.photo_day ?? ""} disabled={disabled || !value.photo_month} onChange={(event) => { if (/^\d*$/.test(event.target.value)) onChange({ ...value, photo_day: event.target.value ? Number(event.target.value) : null }); }} /></label>
    </div>
    <p>Alleen het jaar weten is ook goed. {batch ? "Deze datum geldt voor alle geselecteerde foto’s. Verschillende datums? Laat dit leeg; je kunt ze later per foto aanvullen." : "Je kunt de datum later aanvullen of leegmaken."}</p>
  </fieldset>;
}
