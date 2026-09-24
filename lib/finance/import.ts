import { parse } from "csv-parse/sync";
import ExcelJS from "exceljs";

type BankRow = Record<string, string>;
export type FinanceTransaction = {
  fingerprint: string;
  account_iban: string;
  counterparty_iban: string | null;
  booked_on: string;
  sequence: number;
  amount_cents: number;
  balance_cents: number | null;
  counterparty: string | null;
  description: string;
  category: string;
  is_internal_transfer: boolean;
};

const headers = ["IBAN/BBAN", "Datum", "Bedrag", "Saldo na trn"];

function normalize(value: unknown) {
  return String(value ?? "").trim();
}

function cents(value: string) {
  const raw = value.replace(/[^0-9,.-]/g, "");
  const clean = raw.includes(",") ? raw.replace(/\./g, "").replace(",", ".") : raw;
  const number = Number(clean);
  if (!Number.isFinite(number)) throw new Error("Een bedrag in het bankbestand is ongeldig.");
  return Math.round(number * 100);
}

function categoryFor(description: string, counterparty: string) {
  const text = `${description} ${counterparty}`.toLowerCase();
  if (/huur|hypotheek|energ|waternet|gemeente|verzekering/.test(text)) return "Wonen & vast";
  if (/supermarkt|ah |albert heijn|jumbo|lidl|aldi|plus /.test(text)) return "Boodschappen";
  if (/restaurant|cafe|café|thuisbezorgd|uber eats|deliveroo/.test(text)) return "Eten & drinken";
  if (/ns |ov-chip|tank|shell|bp |q8 |parkeren/.test(text)) return "Vervoer";
  if (/spotify|netflix|youtube|apple.com|disney|abonnement/.test(text)) return "Abonnementen";
  if (/salaris|loon|payroll/.test(text)) return "Salaris";
  return "Overig";
}

async function rowsFromFile(file: File): Promise<BankRow[]> {
  const bytes = Buffer.from(await file.arrayBuffer());
  if (file.name.toLowerCase().endsWith(".csv")) {
    // ING exports can contain Windows-1252 text and semicolon-separated amounts.
    let source = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
    if (source.includes("\uFFFD")) source = new TextDecoder("windows-1252").decode(bytes);
    const firstLine = source.split(/\r?\n/, 1)[0];
    const delimiter = (firstLine.match(/;/g)?.length ?? 0) > (firstLine.match(/,/g)?.length ?? 0) ? ";" : ",";
    try {
      return parse(source, {
        columns: (names: string[]) => names.map((name) => name.trim().replace(/^\uFEFF/, "")),
        skip_empty_lines: true,
        delimiter,
        relax_quotes: true,
        bom: true,
      }) as BankRow[];
    } catch {
      throw new Error("Het CSV-bestand kan niet worden gelezen.");
    }
  }
  if (!/\.xlsx$/i.test(file.name)) throw new Error("Gebruik een CSV- of XLSX-bestand.");
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(bytes as unknown as Parameters<typeof workbook.xlsx.load>[0]);
  const sheet = workbook.worksheets[0];
  if (!sheet) throw new Error("Het Excel-bestand heeft geen werkblad.");
  const names = (sheet.getRow(1).values as ExcelJS.CellValue[]).slice(1).map(normalize);
  const rows: BankRow[] = [];
  sheet.eachRow((row, index) => {
    if (index === 1) return;
    const values = (row.values as ExcelJS.CellValue[]).slice(1).map((value) =>
      value instanceof Date ? value.toISOString().slice(0, 10) : normalize(value),
    );
    rows.push(Object.fromEntries(names.map((name, i) => [name, values[i] ?? ""])));
  });
  return rows;
}

export async function parseBankFile(file: File) {
  if (file.size > 5_000_000) throw new Error("Het bestand mag maximaal 5 MB zijn.");
  const rows = await rowsFromFile(file);
  if (!rows.length || !headers.every((header) => header in rows[0])) {
    throw new Error("Deze export heeft niet de verwachte bankkolommen.");
  }
  if (rows.length > 20_000) throw new Error("Importeer maximaal 20.000 transacties tegelijk.");
  const ibans = new Set(rows.map((row) => normalize(row["IBAN/BBAN"]).replace(/\s/g, "").toUpperCase()));
  const transactions = await Promise.all(rows.map(async (row) => {
    const account = normalize(row["IBAN/BBAN"]).replace(/\s/g, "").toUpperCase();
    const counterpartyIban = normalize(row["Tegenrekening IBAN/BBAN"]).replace(/\s/g, "").toUpperCase();
    const date = normalize(row.Datum);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !account) {
      throw new Error("Een datum of rekeningnummer in het bankbestand is ongeldig.");
    }
    const amount = cents(row.Bedrag);
    const description = [row["Omschrijving-1"], row["Omschrijving-2"], row["Omschrijving-3"]]
      .map(normalize)
      .filter(Boolean)
      .join(" ")
      .slice(0, 1000);
    const counterparty = normalize(row["Naam tegenpartij"]).slice(0, 200);
    const fingerprintBytes = new TextEncoder().encode(
      [account, row.Volgnr, date, amount, row.Transactiereferentie, counterpartyIban, description].join("\u001f"),
    );
    const fingerprint = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", fingerprintBytes)))
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");
    return {
      fingerprint,
      account_iban: account,
      counterparty_iban: counterpartyIban || null,
      booked_on: date,
      sequence: Number(row.Volgnr) || 0,
      amount_cents: amount,
      balance_cents: row["Saldo na trn"] ? cents(row["Saldo na trn"]) : null,
      counterparty: counterparty || null,
      description,
      category: categoryFor(description, counterparty),
      is_internal_transfer: ibans.has(counterpartyIban),
    } satisfies FinanceTransaction;
  }));
  return { transactions, accounts: [...ibans] };
}
