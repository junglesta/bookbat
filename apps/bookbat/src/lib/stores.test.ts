import { beforeEach, describe, expect, it, vi } from "vitest";
import { loadCollection, saveCollection } from "./storage";
import { RELEASE_RESET_STORAGE_KEY } from "./storage-keys";
import { getBooks, importBooksToCollection, loadBooks } from "./stores.svelte.ts";
import type { Book, BookCollection } from "./types";

vi.mock("./isbn-lookup", () => ({
  lookupIsbn: vi.fn(),
}));

vi.mock("./scan", () => ({
  scanIsbnWithDeps: vi.fn(),
}));

const store: Record<string, string> = {};
const localStorageMock = {
  getItem: vi.fn((key: string) => store[key] ?? null),
  setItem: vi.fn((key: string, value: string) => {
    store[key] = value;
  }),
  removeItem: vi.fn((key: string) => {
    delete store[key];
  }),
  clear: vi.fn(() => {
    for (const key in store) delete store[key];
  }),
};

vi.stubGlobal("localStorage", localStorageMock);
vi.stubGlobal("crypto", { randomUUID: vi.fn(() => "merged-book-id") });

Object.defineProperty(navigator, "serviceWorker", {
  value: { controller: { postMessage: vi.fn() } },
  configurable: true,
});

function makeBook(overrides: Partial<Book> = {}): Book {
  return {
    id: "book-1",
    isbn13: "9780141439518",
    title: "Pride and Prejudice",
    authors: ["Jane Austen"],
    status: "to-read",
    dateAdded: "2025-01-01T00:00:00.000Z",
    source: "openlibrary",
    ...overrides,
  };
}

function seedCollection(books: Book[]) {
  const collection: BookCollection = { version: 1, books };
  saveCollection(collection);
  localStorage.setItem(RELEASE_RESET_STORAGE_KEY, "1");
  loadBooks();
}

describe("importBooksToCollection", () => {
  beforeEach(() => {
    for (const key in store) delete store[key];
    vi.clearAllMocks();
  });

  it("adds brand new books", () => {
    seedCollection([]);

    const summary = importBooksToCollection([
      {
        isbn13: "9780000000001",
        title: "New Book",
        authors: ["Author One"],
        status: "to-read",
        source: "manual",
      },
    ]);

    expect(summary).toEqual({ total: 1, added: 1, merged: 0, skipped: 0, failed: 0 });
    expect(getBooks()).toHaveLength(1);
    expect(getBooks()[0].title).toBe("New Book");
  });

  it("merges imported metadata into existing books without clobbering personal fields", () => {
    seedCollection([
      makeBook({
        authors: ["Unknown Author"],
        notes: "My note",
        tags: ["favorite"],
        rating: 5,
        status: "reading",
      }),
    ]);

    const summary = importBooksToCollection([
      {
        isbn13: "9780141439518",
        title: "Pride and Prejudice",
        authors: ["Jane Austen"],
        publisher: "Penguin",
        publishYear: 2002,
        pageCount: 480,
        language: "eng",
        synopsis: "A recovered synopsis.",
        coverUrl: "https://covers.example/cover.jpg",
        notes: "Imported note should not override",
        tags: ["classic"],
        rating: 1,
        status: "read",
      },
    ]);

    expect(summary).toEqual({ total: 1, added: 0, merged: 1, skipped: 0, failed: 0 });

    const [merged] = getBooks();
    expect(merged.authors).toEqual(["Jane Austen"]);
    expect(merged.publisher).toBe("Penguin");
    expect(merged.publishYear).toBe(2002);
    expect(merged.pageCount).toBe(480);
    expect(merged.language).toBe("eng");
    expect(merged.synopsis).toBe("A recovered synopsis.");
    expect(merged.coverUrl).toBe("https://covers.example/cover.jpg");
    expect(merged.notes).toBe("My note");
    expect(merged.tags).toEqual(["favorite"]);
    expect(merged.rating).toBe(5);
    expect(merged.status).toBe("reading");
  });

  it("skips duplicate imports when they add no new information", () => {
    seedCollection([
      makeBook({
        publisher: "Penguin",
        synopsis: "Already present.",
      }),
    ]);

    const summary = importBooksToCollection([
      {
        isbn13: "9780141439518",
        title: "Pride and Prejudice",
        authors: ["Jane Austen"],
        publisher: "Penguin",
        synopsis: "Already present.",
      },
    ]);

    expect(summary).toEqual({ total: 1, added: 0, merged: 0, skipped: 1, failed: 0 });
  });

  it("persists merged updates to storage", () => {
    seedCollection([makeBook({ synopsis: undefined })]);

    importBooksToCollection([
      {
        isbn13: "9780141439518",
        title: "Pride and Prejudice",
        authors: ["Jane Austen"],
        synopsis: "Persisted synopsis.",
      },
    ]);

    const stored = loadCollection();
    expect(stored.books[0].synopsis).toBe("Persisted synopsis.");
  });
});
