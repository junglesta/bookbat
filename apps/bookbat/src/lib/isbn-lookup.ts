import { cleanIsbn, toIsbn13 } from "./isbn";
import type { Book } from "./types";

const LOOKUP_TIMEOUT_MS = 8000;

type JsonRecord = Record<string, unknown>;

function asRecord(value: unknown): JsonRecord {
  return typeof value === "object" && value !== null ? (value as JsonRecord) : {};
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
}

function normalizeSynopsis(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const synopsis = value.trim();
  return synopsis ? synopsis : undefined;
}

function extractOpenLibraryDescription(value: unknown): string | undefined {
  const direct = normalizeSynopsis(value);
  if (direct) return direct;
  if (typeof value === "object" && value !== null) {
    const nested = normalizeSynopsis(asRecord(value).value);
    if (nested) return nested;
  }
  return undefined;
}

async function fetchJson(url: string): Promise<JsonRecord | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), LOOKUP_TIMEOUT_MS);
  try {
    const resp = await fetch(url, { signal: controller.signal });
    if (!resp.ok) return null;
    const data = await resp.json();
    return asRecord(data);
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export async function lookupIsbn(isbn: string): Promise<Book | null> {
  const cleaned = cleanIsbn(isbn);
  const normalizedIsbn13 = toIsbn13(cleaned);
  if (!normalizedIsbn13) return null;

  // Try Open Library first
  const olResult = await tryOpenLibrary(cleaned, normalizedIsbn13);
  if (olResult) {
    // If OpenLibrary didn't provide language, try Google Books for it
    if (!olResult.language) {
      const gbLang = await tryGoogleBooksLanguage(cleaned);
      if (gbLang) olResult.language = gbLang;
    }
    if (!olResult.synopsis) {
      const searchSynopsis = await tryOpenLibrarySynopsisBySearch(olResult.title, olResult.authors);
      if (searchSynopsis) olResult.synopsis = searchSynopsis;
    }
    return olResult;
  }

  // Fallback to Google Books
  const gbResult = await tryGoogleBooks(cleaned, normalizedIsbn13);
  if (gbResult) {
    if (!gbResult.synopsis) {
      const searchSynopsis = await tryOpenLibrarySynopsisBySearch(gbResult.title, gbResult.authors);
      if (searchSynopsis) gbResult.synopsis = searchSynopsis;
    }
    return gbResult;
  }

  return null;
}

async function tryOpenLibrary(isbn: string, normalizedIsbn13: string): Promise<Book | null> {
  const data = await fetchJson(`https://openlibrary.org/isbn/${isbn}.json`);
  if (!data) return null;

  // Resolve author names
  const authors: string[] = [];
  const authorRefs = Array.isArray(data.authors) ? data.authors : [];
  for (const authorRef of authorRefs) {
    const key = asString(asRecord(authorRef).key);
    if (!key) continue;
    const authorData = await fetchJson(`https://openlibrary.org${key}.json`);
    if (authorData) {
      authors.push(asString(authorData.name) || "Unknown Author");
    }
  }

  // Extract ISBNs
  const isbn13 = normalizedIsbn13;
  const isbn10Candidates = asStringArray(data.isbn_10);
  const isbn10 = isbn.length === 10 ? isbn : isbn10Candidates[0] || undefined;

  // Extract cover URL
  const covers = Array.isArray(data.covers) ? data.covers : [];
  const coverId = typeof covers[0] === "number" ? covers[0] : undefined;
  const coverUrl = coverId ? `https://covers.openlibrary.org/b/id/${coverId}-L.jpg` : undefined;

  // Extract publish year
  const publishDate = asString(data.publish_date);
  const publishYear = publishDate ? extractYear(publishDate) : undefined;

  // Extract subjects from works
  let subjects: string[] | undefined;
  let synopsis: string | undefined;
  const works = Array.isArray(data.works) ? data.works : [];
  const workKey = asString(asRecord(works[0]).key);
  if (workKey) {
    const worksData = await fetchJson(`https://openlibrary.org${workKey}.json`);
    if (worksData) {
      subjects = asStringArray(worksData.subjects).slice(0, 10);
      synopsis = extractOpenLibraryDescription(worksData.description);
    }
  }
  if (!synopsis) {
    synopsis = extractOpenLibraryDescription(data.description);
  }

  return {
    id: "",
    isbn13,
    isbn10,
    title: asString(data.title) || "Unknown Title",
    authors,
    publisher: asStringArray(data.publishers)[0] || undefined,
    publishDate,
    publishYear,
    pageCount: typeof data.number_of_pages === "number" ? data.number_of_pages : undefined,
    language: asString(
      asRecord(Array.isArray(data.languages) ? data.languages[0] : undefined).key,
    )?.replace("/languages/", ""),
    subjects,
    synopsis,
    coverUrl,
    status: "to-read",
    dateAdded: "",
    source: "openlibrary",
  };
}

async function tryGoogleBooks(isbn: string, normalizedIsbn13: string): Promise<Book | null> {
  const data = await fetchJson(`https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`);
  if (!data) return null;

  const items = Array.isArray(data.items) ? data.items : [];
  if (items.length === 0) return null;

  const vol = asRecord(asRecord(items[0]).volumeInfo);
  const isbn13 = normalizedIsbn13;

  // Find ISBN-10 from response
  let isbn10: string | undefined;
  const identifiers = Array.isArray(vol.industryIdentifiers) ? vol.industryIdentifiers : [];
  for (const id of identifiers) {
    const rec = asRecord(id);
    if (rec.type === "ISBN_10") {
      isbn10 = asString(rec.identifier);
      break;
    }
  }

  const publishedDate = asString(vol.publishedDate);
  const publishYear = publishedDate ? extractYear(publishedDate) : undefined;

  const thumb = asString(asRecord(vol.imageLinks).thumbnail);
  return {
    id: "",
    isbn13,
    isbn10,
    title: asString(vol.title) || "Unknown Title",
    authors: asStringArray(vol.authors),
    publisher: asString(vol.publisher),
    publishDate: publishedDate,
    publishYear,
    pageCount: typeof vol.pageCount === "number" ? vol.pageCount : undefined,
    language: asString(vol.language),
    subjects: asStringArray(vol.categories).slice(0, 10),
    synopsis: normalizeSynopsis(vol.description),
    coverUrl: thumb?.replace("http:", "https:"),
    status: "to-read",
    dateAdded: "",
    source: "googlebooks",
  };
}

async function tryGoogleBooksLanguage(isbn: string): Promise<string | null> {
  const data = await fetchJson(`https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`);
  if (!data) return null;
  const items = Array.isArray(data.items) ? data.items : [];
  const language = asString(asRecord(asRecord(items[0]).volumeInfo).language);
  return language || null;
}

async function tryOpenLibrarySynopsisBySearch(
  title: string,
  authors: string[],
): Promise<string | undefined> {
  const cleanTitle = title.trim();
  if (!cleanTitle) return undefined;

  const params = new URLSearchParams({
    title: cleanTitle,
    limit: "1",
  });
  const firstAuthor = authors.find((author) => author.trim().length > 0);
  if (firstAuthor) {
    params.set("author", firstAuthor.trim());
  }

  const searchData = await fetchJson(`https://openlibrary.org/search.json?${params.toString()}`);
  if (!searchData) return undefined;

  const docs = Array.isArray(searchData.docs) ? searchData.docs : [];
  const workKey = asString(asRecord(docs[0]).key);
  if (!workKey || !workKey.startsWith("/works/")) return undefined;

  const worksData = await fetchJson(`https://openlibrary.org${workKey}.json`);
  if (!worksData) return undefined;

  return extractOpenLibraryDescription(worksData.description);
}

function extractYear(dateStr: string): number | undefined {
  const match = dateStr.match(/(\d{4})/);
  return match ? parseInt(match[1], 10) : undefined;
}
