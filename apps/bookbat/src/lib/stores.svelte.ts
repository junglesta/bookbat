import { getErrorMessage } from "./error";
import { lookupIsbn } from "./isbn-lookup";
import { scanIsbnWithDeps } from "./scan";
import { addBook, clearBooks, deleteBook, getAllBooks, getBookByIsbn, updateBook } from "./storage";
import {
  COLLECTION_SEEDED_STORAGE_KEY,
  COLLECTION_STORAGE_KEY,
  LEGACY_COLLECTION_SEEDED_STORAGE_KEY,
  LEGACY_COLLECTION_STORAGE_KEY,
  LEGACY_LIBRARY_NAME_STORAGE_KEY,
  LEGACY_LIBRARY_NAME_STORAGE_KEY_V0,
  LEGACY_RELEASE_RESET_STORAGE_KEY,
  LIBRARY_NAME_STORAGE_KEY,
  RELEASE_RESET_STORAGE_KEY,
} from "./storage-keys";
import type { Book, ScanResult } from "./types";

// Book collection state
let books = $state<Book[]>([]);
let loading = $state(false);
let error = $state<string | null>(null);

// Toast state
let toastMessage = $state("");
let toastVisible = $state(false);
let toastTimeout: ReturnType<typeof setTimeout> | null = null;

function loadLibraryName(): string {
  const current = localStorage.getItem(LIBRARY_NAME_STORAGE_KEY);
  if (current) return current;

  const legacy = localStorage.getItem(LEGACY_LIBRARY_NAME_STORAGE_KEY);
  if (legacy) {
    localStorage.setItem(LIBRARY_NAME_STORAGE_KEY, legacy);
    return legacy;
  }

  const legacyV0 = localStorage.getItem(LEGACY_LIBRARY_NAME_STORAGE_KEY_V0);
  if (legacyV0) {
    localStorage.setItem(LIBRARY_NAME_STORAGE_KEY, legacyV0);
    return legacyV0;
  }

  return "Library";
}

// Library name state
let libraryName = $state(loadLibraryName());

export function getLibraryName() {
  return libraryName;
}

export function setLibraryName(name: string) {
  libraryName = name;
  localStorage.setItem(LIBRARY_NAME_STORAGE_KEY, name);
}

// Current route
let currentRoute = $state(window.location.hash || "#/scan");

// Listen for hash changes
window.addEventListener("hashchange", () => {
  currentRoute = window.location.hash || "#/scan";
});

export function getRoute() {
  return currentRoute;
}

export function navigate(hash: string) {
  window.location.hash = hash;
}

export function getBooks() {
  return books;
}

export function isLoading() {
  return loading;
}

export function getError() {
  return error;
}

export function loadBooks() {
  loading = true;
  error = null;
  try {
    applyReleaseResetOnce();
    books = getAllBooks();
  } catch (e: unknown) {
    error = getErrorMessage(e, "Failed to load books");
  } finally {
    loading = false;
  }
}

function applyReleaseResetOnce() {
  if (
    localStorage.getItem(RELEASE_RESET_STORAGE_KEY) === "1" ||
    localStorage.getItem(LEGACY_RELEASE_RESET_STORAGE_KEY) === "1"
  ) {
    return;
  }

  localStorage.removeItem(COLLECTION_STORAGE_KEY);
  localStorage.removeItem(LEGACY_COLLECTION_STORAGE_KEY);
  localStorage.removeItem(COLLECTION_SEEDED_STORAGE_KEY);
  localStorage.removeItem(LEGACY_COLLECTION_SEEDED_STORAGE_KEY);
  localStorage.setItem(RELEASE_RESET_STORAGE_KEY, "1");
  navigator.serviceWorker?.controller?.postMessage({ type: "CLEAR_COVER_CACHE" });
}

export function addBookToCollection(book: Partial<Book>) {
  try {
    const saved = addBook(book);
    books = [...books, saved];
    showToast("Book added to library!");
    return saved;
  } catch (e: unknown) {
    showToast(getErrorMessage(e, "Failed to add book"));
    throw e;
  }
}

export interface ImportBooksSummary {
  total: number;
  added: number;
  merged: number;
  skipped: number;
  failed: number;
}

function isBlankString(value: string | undefined): boolean {
  return value === undefined || value.trim() === "";
}

function isMeaningfulStringArray(value: string[] | undefined): value is string[] {
  return Array.isArray(value) && value.length > 0;
}

function hasPlaceholderAuthors(authors: string[]): boolean {
  return authors.length === 1 && authors[0] === "Unknown Author";
}

function buildImportedBookMergeUpdates(
  existing: Book,
  candidate: Partial<Book>,
): Partial<Book> | null {
  const updates: Partial<Book> = {};

  if (isBlankString(existing.isbn10) && !isBlankString(candidate.isbn10)) {
    updates.isbn10 = candidate.isbn10;
  }
  if (isBlankString(existing.publisher) && !isBlankString(candidate.publisher)) {
    updates.publisher = candidate.publisher;
  }
  if (isBlankString(existing.publishDate) && !isBlankString(candidate.publishDate)) {
    updates.publishDate = candidate.publishDate;
  }
  if (existing.publishYear === undefined && candidate.publishYear !== undefined) {
    updates.publishYear = candidate.publishYear;
  }
  if (existing.pageCount === undefined && candidate.pageCount !== undefined) {
    updates.pageCount = candidate.pageCount;
  }
  if (isBlankString(existing.language) && !isBlankString(candidate.language)) {
    updates.language = candidate.language;
  }
  if (!isMeaningfulStringArray(existing.subjects) && isMeaningfulStringArray(candidate.subjects)) {
    updates.subjects = candidate.subjects;
  }
  if (isBlankString(existing.synopsis) && !isBlankString(candidate.synopsis)) {
    updates.synopsis = candidate.synopsis;
  }
  if (isBlankString(existing.coverUrl) && !isBlankString(candidate.coverUrl)) {
    updates.coverUrl = candidate.coverUrl;
  }
  if (hasPlaceholderAuthors(existing.authors) && isMeaningfulStringArray(candidate.authors)) {
    updates.authors = candidate.authors;
  }

  return Object.keys(updates).length > 0 ? updates : null;
}

export function importBooksToCollection(imported: Partial<Book>[]): ImportBooksSummary {
  const booksByIsbn = new Map(books.map((book) => [book.isbn13, book] as const));
  const nextBooks = [...books];
  let added = 0;
  let merged = 0;
  let skipped = 0;
  let failed = 0;

  for (const candidate of imported) {
    if (typeof candidate.isbn13 !== "string") {
      skipped++;
      continue;
    }

    const existing = booksByIsbn.get(candidate.isbn13);

    try {
      if (existing) {
        const updates = buildImportedBookMergeUpdates(existing, candidate);
        if (!updates) {
          skipped++;
          continue;
        }

        const updated = updateBook(existing.id, updates);
        const index = nextBooks.findIndex((book) => book.id === existing.id);
        if (index !== -1) {
          nextBooks[index] = updated;
        }
        booksByIsbn.set(updated.isbn13, updated);
        merged++;
        continue;
      }

      const saved = addBook({
        ...candidate,
        status: candidate.status || "to-read",
        source: candidate.source || "manual",
      });
      booksByIsbn.set(saved.isbn13, saved);
      nextBooks.push(saved);
      added++;
    } catch {
      failed++;
    }
  }

  books = nextBooks;

  return { total: imported.length, added, merged, skipped, failed };
}

export interface UpdateBookInCollectionOptions {
  silent?: boolean;
}

export function updateBookInCollection(
  id: string,
  updates: Partial<Book>,
  options: UpdateBookInCollectionOptions = {},
) {
  try {
    const updated = updateBook(id, updates);
    books = books.map((b) => (b.id === id ? updated : b));
    if (!options.silent) {
      showToast("Book updated!");
    }
    return updated;
  } catch (e: unknown) {
    if (!options.silent) {
      showToast(getErrorMessage(e, "Failed to update book"));
    }
    throw e;
  }
}

export function setBookCoverUrl(id: string, coverUrl: string) {
  const current = books.find((b) => b.id === id);
  if (!current || current.coverUrl === coverUrl) return;
  const updated = updateBook(id, { coverUrl });
  books = books.map((b) => (b.id === id ? updated : b));
}

export function removeBookFromCollection(id: string) {
  try {
    deleteBook(id);
    books = books.filter((b) => b.id !== id);
    showToast("Book removed.");
  } catch (e: unknown) {
    showToast(getErrorMessage(e, "Failed to remove book"));
    throw e;
  }
}

export function clearLibraryCollection() {
  try {
    clearBooks();
    books = [];
    navigator.serviceWorker?.controller?.postMessage({ type: "CLEAR_COVER_CACHE" });
    showToast("Library cleared.");
  } catch (e: unknown) {
    showToast(getErrorMessage(e, "Failed to clear library"));
    throw e;
  }
}

export async function scanIsbn(isbn: string): Promise<ScanResult> {
  return scanIsbnWithDeps(isbn, {
    findByIsbn13: getBookByIsbn,
    lookupByIsbn: lookupIsbn,
  });
}

export function showToast(message: string) {
  toastMessage = message;
  toastVisible = true;
  if (toastTimeout) clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toastVisible = false;
  }, 3000);
}

export function getToastMessage() {
  return toastMessage;
}

export function isToastVisible() {
  return toastVisible;
}
