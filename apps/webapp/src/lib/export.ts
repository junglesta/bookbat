import type { Book } from "./types";

const FORMULA_PREFIX_RE = /^[\t\r\n ]*[=+\-@]/;

function sanitizeSpreadsheetValue(val: string): string {
  if (FORMULA_PREFIX_RE.test(val)) {
    return `'${val}`;
  }
  return val;
}

function escapeCsv(val: string): string {
  if (val.includes(",") || val.includes('"') || val.includes("\n")) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}

export function generateCsv(books: Book[]): string {
  const headers = [
    "Title",
    "Authors",
    "ISBN-13",
    "ISBN-10",
    "Publisher",
    "Publish Date",
    "Year",
    "Pages",
    "Language",
    "Status",
    "Rating",
    "Date Added",
    "Date Read",
    "Tags",
    "Notes",
  ];

  const rows = books.map((b) => [
    escapeCsv(sanitizeSpreadsheetValue(b.title)),
    escapeCsv(sanitizeSpreadsheetValue(b.authors.join("; "))),
    b.isbn13,
    b.isbn10 || "",
    escapeCsv(sanitizeSpreadsheetValue(b.publisher || "")),
    escapeCsv(sanitizeSpreadsheetValue(b.publishDate || "")),
    b.publishYear?.toString() || "",
    b.pageCount?.toString() || "",
    sanitizeSpreadsheetValue(b.language || ""),
    b.status,
    b.rating?.toString() || "",
    b.dateAdded,
    b.dateRead || "",
    escapeCsv(sanitizeSpreadsheetValue((b.tags || []).join("; "))),
    escapeCsv(sanitizeSpreadsheetValue(b.notes || "")),
  ]);

  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
}

export function generateGoodreadsCsv(books: Book[]): string {
  const headers = [
    "Title",
    "Author",
    "ISBN",
    "ISBN13",
    "My Rating",
    "Number of Pages",
    "Year Published",
    "Date Read",
    "Date Added",
    "Exclusive Shelf",
    "My Review",
  ];

  const shelfMap: Record<string, string> = {
    "to-read": "to-read",
    reading: "currently-reading",
    read: "read",
  };

  const rows = books.map((b) => [
    escapeCsv(sanitizeSpreadsheetValue(b.title)),
    escapeCsv(sanitizeSpreadsheetValue(b.authors[0] || "")),
    `="${b.isbn10 || ""}"`,
    `="${b.isbn13}"`,
    b.rating?.toString() || "0",
    b.pageCount?.toString() || "",
    b.publishYear?.toString() || "",
    b.dateRead ? formatGoodreadsDate(b.dateRead) : "",
    formatGoodreadsDate(b.dateAdded),
    shelfMap[b.status] || "to-read",
    escapeCsv(sanitizeSpreadsheetValue(b.notes || "")),
  ]);

  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
}

export function generateLibraryThingTsv(books: Book[]): string {
  const headers = [
    "Title",
    "Author (First, Last)",
    "Date",
    "ISBN",
    "Rating",
    "Tags",
    "Review",
    "Page Count",
    "Publication",
    "Date Read",
  ];

  const rows = books.map((b) => [
    sanitizeSpreadsheetValue(b.title),
    sanitizeSpreadsheetValue(b.authors[0] || ""),
    b.dateAdded ? b.dateAdded.split("T")[0] : "",
    b.isbn13,
    b.rating?.toString() || "",
    sanitizeSpreadsheetValue((b.tags || []).join(", ")),
    sanitizeSpreadsheetValue(b.notes || ""),
    b.pageCount?.toString() || "",
    sanitizeSpreadsheetValue(b.publisher || ""),
    b.dateRead ? b.dateRead.split("T")[0] : "",
  ]);

  return [headers.join("\t"), ...rows.map((r) => r.join("\t"))].join("\n");
}

export function generateBookText(book: Book): string {
  const lines = [
    book.title,
    book.authors.join(", "),
    book.publisher,
    book.publishYear?.toString(),
    book.pageCount ? `${book.pageCount} pages` : undefined,
    `ISBN: ${book.isbn13}`,
    book.synopsis?.trim() || undefined,
  ];

  return lines
    .filter((line): line is string => typeof line === "string" && line.trim().length > 0)
    .join("\n");
}

export function downloadBlob(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function formatGoodreadsDate(isoDate: string): string {
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) {
    return "";
  }
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}/${mm}/${dd}`;
}
