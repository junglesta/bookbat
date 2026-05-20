import { COLLECTION_STORAGE_KEY, LEGACY_COLLECTION_STORAGE_KEY } from "./storage-keys";
import type { Book, BookCollection } from "./types";

const BOOK_STATUSES = new Set<Book["status"]>(["to-read", "reading", "read"]);
const BOOK_SOURCES = new Set<Book["source"]>(["openlibrary", "googlebooks", "manual"]);

type UnknownRecord = Record<string, unknown>;

function emptyCollection(): BookCollection {
  return { version: 1, books: [] };
}

function asRecord(value: unknown): UnknownRecord | null {
  return typeof value === "object" && value !== null ? (value as UnknownRecord) : null;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((v) => typeof v === "string");
}

function asOptionalString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function asOptionalStringArray(value: unknown): string[] | undefined {
  return isStringArray(value) ? value : undefined;
}

function asOptionalNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function sanitizeBook(input: unknown): Book | null {
  const raw = asRecord(input);
  if (!raw) return null;

  const { id, isbn13, title, authors, status, dateAdded, source } = raw;
  if (typeof id !== "string") return null;
  if (typeof isbn13 !== "string") return null;
  if (typeof title !== "string") return null;
  if (!isStringArray(authors)) return null;
  if (typeof dateAdded !== "string") return null;
  if (typeof status !== "string" || !BOOK_STATUSES.has(status as Book["status"])) return null;
  if (typeof source !== "string" || !BOOK_SOURCES.has(source as Book["source"])) return null;

  return {
    id,
    isbn13,
    title,
    authors,
    status: status as Book["status"],
    dateAdded,
    source: source as Book["source"],
    isbn10: asOptionalString(raw.isbn10),
    publisher: asOptionalString(raw.publisher),
    publishDate: asOptionalString(raw.publishDate),
    publishYear: asOptionalNumber(raw.publishYear),
    pageCount: asOptionalNumber(raw.pageCount),
    language: asOptionalString(raw.language),
    subjects: asOptionalStringArray(raw.subjects),
    synopsis: asOptionalString(raw.synopsis),
    coverUrl: asOptionalString(raw.coverUrl),
    rating: asOptionalNumber(raw.rating),
    notes: asOptionalString(raw.notes),
    tags: asOptionalStringArray(raw.tags),
    dateRead: asOptionalString(raw.dateRead),
  };
}

function migrateV1(input: UnknownRecord): { collection: BookCollection; migrated: boolean } {
  const rawBooks = Array.isArray(input.books) ? input.books : [];
  const books = rawBooks.map((b) => sanitizeBook(b)).filter((b): b is Book => b !== null);
  const migrated = input.version !== 1 || books.length !== rawBooks.length;
  return { collection: { version: 1, books }, migrated };
}

function migrateCollection(input: unknown): { collection: BookCollection; migrated: boolean } {
  const raw = asRecord(input);
  if (!raw) return { collection: emptyCollection(), migrated: false };

  const version = raw.version;
  if (version === 1 || version === undefined) {
    return migrateV1(raw);
  }

  // Future migration entrypoint: add migrateV2/migrateV3 branches here.
  return { collection: emptyCollection(), migrated: true };
}

export function loadCollection(): BookCollection {
  try {
    const rawCurrent = localStorage.getItem(COLLECTION_STORAGE_KEY);
    const rawLegacy = localStorage.getItem(LEGACY_COLLECTION_STORAGE_KEY);
    const usingLegacy = !rawCurrent && !!rawLegacy;
    const raw = rawCurrent ?? rawLegacy;
    if (!raw) return emptyCollection();
    const parsed = JSON.parse(raw);
    const { collection, migrated } = migrateCollection(parsed);
    if (usingLegacy || migrated) {
      saveCollection(collection);
    }
    if (usingLegacy) {
      localStorage.removeItem(LEGACY_COLLECTION_STORAGE_KEY);
    }
    return collection;
  } catch {
    return emptyCollection();
  }
}

export function saveCollection(collection: BookCollection): void {
  localStorage.setItem(COLLECTION_STORAGE_KEY, JSON.stringify(collection));
}

export function getAllBooks(): Book[] {
  return loadCollection().books;
}

export function getBookByIsbn(isbn13: string): Book | undefined {
  return loadCollection().books.find((b) => b.isbn13 === isbn13);
}

function buildNewBook(input: Partial<Book>): Book {
  if (typeof input.isbn13 !== "string" || !input.isbn13) {
    throw new Error("Book must include isbn13");
  }
  if (typeof input.title !== "string" || !input.title) {
    throw new Error("Book must include title");
  }
  if (!isStringArray(input.authors)) {
    throw new Error("Book must include authors");
  }
  if (!input.status || !BOOK_STATUSES.has(input.status)) {
    throw new Error("Book must include valid status");
  }
  if (!input.source || !BOOK_SOURCES.has(input.source)) {
    throw new Error("Book must include valid source");
  }

  const now = new Date().toISOString();

  return {
    id: crypto.randomUUID(),
    isbn13: input.isbn13,
    title: input.title,
    authors: input.authors,
    status: input.status,
    source: input.source,
    dateAdded: now,
    isbn10: input.isbn10,
    publisher: input.publisher,
    publishDate: input.publishDate,
    publishYear: input.publishYear,
    pageCount: input.pageCount,
    language: input.language,
    subjects: input.subjects,
    synopsis: input.synopsis,
    coverUrl: input.coverUrl,
    rating: input.rating,
    notes: input.notes,
    tags: input.tags,
    dateRead: input.dateRead,
  };
}

export function addBook(book: Partial<Book>): Book {
  const collection = loadCollection();
  const full = buildNewBook(book);
  collection.books.push(full);
  saveCollection(collection);
  return full;
}

function sanitizeBookUpdates(updates: Partial<Book>): Partial<Book> {
  const next: Partial<Book> = {};

  if (updates.isbn13 !== undefined) {
    if (typeof updates.isbn13 !== "string" || !updates.isbn13) throw new Error("Invalid isbn13");
    next.isbn13 = updates.isbn13;
  }
  if (updates.title !== undefined) {
    if (typeof updates.title !== "string" || !updates.title) throw new Error("Invalid title");
    next.title = updates.title;
  }
  if (updates.authors !== undefined) {
    if (!isStringArray(updates.authors)) throw new Error("Invalid authors");
    next.authors = updates.authors;
  }
  if (updates.status !== undefined) {
    if (!BOOK_STATUSES.has(updates.status)) throw new Error("Invalid status");
    next.status = updates.status;
  }
  if (updates.source !== undefined) {
    if (!BOOK_SOURCES.has(updates.source)) throw new Error("Invalid source");
    next.source = updates.source;
  }

  const passthrough: (keyof Book)[] = [
    "isbn10",
    "publisher",
    "publishDate",
    "publishYear",
    "pageCount",
    "language",
    "subjects",
    "synopsis",
    "coverUrl",
    "rating",
    "notes",
    "tags",
    "dateAdded",
    "dateRead",
  ];

  for (const key of passthrough) {
    if (key in updates) {
      next[key] = updates[key] as never;
    }
  }

  return next;
}

export function updateBook(id: string, updates: Partial<Book>): Book {
  const collection = loadCollection();
  const index = collection.books.findIndex((b) => b.id === id);
  if (index === -1) throw new Error("Book not found");
  const safeUpdates = sanitizeBookUpdates(updates);
  const updated = { ...collection.books[index], ...safeUpdates, id };
  collection.books[index] = updated;
  saveCollection(collection);
  return updated;
}

export function deleteBook(id: string): void {
  const collection = loadCollection();
  collection.books = collection.books.filter((b) => b.id !== id);
  saveCollection(collection);
}

export function clearBooks(): void {
  saveCollection(emptyCollection());
}

export function getRawCollection(): BookCollection {
  return loadCollection();
}
