import type { Book } from "./types";

function normalizeCoverUrl(raw: string | undefined): string | undefined {
  if (!raw) return undefined;

  let value = raw.trim();
  if (!value) return undefined;

  // Handles spreadsheet-style formulas like ="https://..."
  const formulaMatch = value.match(/^=\s*"(.+)"$/);
  if (formulaMatch) {
    value = formulaMatch[1].trim();
  }

  if (value.startsWith("//")) value = `https:${value}`;
  if (value.startsWith("http://")) value = `https://${value.slice("http://".length)}`;
  if (!value.startsWith("https://")) return undefined;

  try {
    const url = new URL(value);
    // OpenLibrary returns a generic "no cover" image by default.
    // Force 404 for missing covers so UI fallback placeholder remains visible.
    if (url.hostname === "covers.openlibrary.org" && !url.searchParams.has("default")) {
      url.searchParams.set("default", "false");
    }
    return url.toString();
  } catch {
    return undefined;
  }
}

function unique(values: Array<string | undefined>): string[] {
  return Array.from(new Set(values.filter((v): v is string => Boolean(v))));
}

export function getCoverCandidates(book: Pick<Book, "coverUrl" | "isbn13" | "isbn10">): string[] {
  const primary = normalizeCoverUrl(book.coverUrl);
  const byIsbn13 = book.isbn13
    ? `https://covers.openlibrary.org/b/isbn/${book.isbn13}-L.jpg?default=false`
    : undefined;
  const byIsbn10 = book.isbn10
    ? `https://covers.openlibrary.org/b/isbn/${book.isbn10}-L.jpg?default=false`
    : undefined;

  return unique([primary, byIsbn13, byIsbn10]);
}
