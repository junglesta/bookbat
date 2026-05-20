import {
  addBook,
  clearBooks,
  deleteBook,
  getAllBooks,
  getBookByIsbn,
  getRawCollection,
  loadCollection,
  saveCollection,
  updateBook,
} from "./storage";
import { COLLECTION_STORAGE_KEY, LEGACY_COLLECTION_STORAGE_KEY } from "./storage-keys";
import type { Book, BookCollection } from "./types";

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
vi.stubGlobal("crypto", { randomUUID: vi.fn(() => "test-uuid-1234") });

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
  store[COLLECTION_STORAGE_KEY] = JSON.stringify({ version: 1, books });
}

beforeEach(() => {
  for (const key in store) delete store[key];
  vi.clearAllMocks();
});

describe("loadCollection", () => {
  it("returns empty collection when localStorage is empty", () => {
    const col = loadCollection();
    expect(col).toEqual({ version: 1, books: [] });
  });

  it("returns empty collection on invalid JSON", () => {
    store[COLLECTION_STORAGE_KEY] = "not-json{{{";
    const col = loadCollection();
    expect(col).toEqual({ version: 1, books: [] });
  });

  it("parses valid stored data", () => {
    const book = makeBook();
    seedCollection([book]);
    const col = loadCollection();
    expect(col.books).toHaveLength(1);
    expect(col.books[0].title).toBe("Pride and Prejudice");
  });

  it("migrates legacy collection without version", () => {
    store[LEGACY_COLLECTION_STORAGE_KEY] = JSON.stringify({ books: [makeBook()] });
    const col = loadCollection();
    expect(col.version).toBe(1);
    expect(col.books).toHaveLength(1);
    expect(localStorageMock.setItem).toHaveBeenCalled();
  });

  it("drops malformed books during migration", () => {
    store[COLLECTION_STORAGE_KEY] = JSON.stringify({
      version: 1,
      books: [{ bad: "record" }, makeBook()],
    });
    const col = loadCollection();
    expect(col.books).toHaveLength(1);
    expect(col.books[0].id).toBe("book-1");
  });

  it("resets unsupported versions to empty collection", () => {
    store[COLLECTION_STORAGE_KEY] = JSON.stringify({
      version: 999,
      books: [makeBook()],
    });
    const col = loadCollection();
    expect(col).toEqual({ version: 1, books: [] });
  });
});

describe("saveCollection", () => {
  it("writes JSON to localStorage", () => {
    const col: BookCollection = { version: 1, books: [makeBook()] };
    saveCollection(col);
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      COLLECTION_STORAGE_KEY,
      JSON.stringify(col),
    );
  });
});

describe("getAllBooks", () => {
  it("returns books array", () => {
    seedCollection([makeBook(), makeBook({ id: "book-2", isbn13: "9780000000000" })]);
    const books = getAllBooks();
    expect(books).toHaveLength(2);
  });

  it("returns empty array when no books", () => {
    expect(getAllBooks()).toEqual([]);
  });
});

describe("getBookByIsbn", () => {
  it("finds a book by ISBN-13", () => {
    seedCollection([makeBook()]);
    const book = getBookByIsbn("9780141439518");
    expect(book?.title).toBe("Pride and Prejudice");
  });

  it("returns undefined for unknown ISBN", () => {
    seedCollection([makeBook()]);
    expect(getBookByIsbn("9999999999999")).toBeUndefined();
  });
});

describe("addBook", () => {
  it("adds a book with generated id and dateAdded", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-06-15T12:00:00.000Z"));

    const book = addBook({
      isbn13: "9780000000000",
      title: "New Book",
      authors: [],
      status: "to-read",
      source: "manual",
    });
    expect(book.id).toBe("test-uuid-1234");
    expect(book.dateAdded).toBe("2025-06-15T12:00:00.000Z");
    expect(book.title).toBe("New Book");

    vi.useRealTimers();
  });

  it("persists to localStorage", () => {
    addBook({
      isbn13: "9780000000000",
      title: "New",
      authors: [],
      status: "to-read",
      source: "manual",
    });
    const stored = JSON.parse(store[COLLECTION_STORAGE_KEY]);
    expect(stored.books).toHaveLength(1);
  });

  it("throws when required fields are missing", () => {
    expect(() => addBook({ title: "Incomplete" })).toThrow("isbn13");
  });
});

describe("updateBook", () => {
  it("modifies an existing book", () => {
    seedCollection([makeBook()]);
    const updated = updateBook("book-1", { rating: 5 });
    expect(updated.rating).toBe(5);
    expect(updated.title).toBe("Pride and Prejudice");
  });

  it("throws for nonexistent book ID", () => {
    seedCollection([makeBook()]);
    expect(() => updateBook("nonexistent", { rating: 3 })).toThrow("Book not found");
  });

  it("preserves the id field", () => {
    seedCollection([makeBook()]);
    const updated = updateBook("book-1", { id: "hacked" } as Partial<Book>);
    expect(updated.id).toBe("book-1");
  });

  it("throws for invalid status updates", () => {
    seedCollection([makeBook()]);
    expect(() => updateBook("book-1", { status: "invalid" as Book["status"] })).toThrow(
      "Invalid status",
    );
  });

  it("updates synopsis", () => {
    seedCollection([makeBook()]);
    const updated = updateBook("book-1", { synopsis: "New synopsis" });
    expect(updated.synopsis).toBe("New synopsis");
  });
});

describe("deleteBook", () => {
  it("removes a book by ID", () => {
    seedCollection([makeBook(), makeBook({ id: "book-2" })]);
    deleteBook("book-1");
    const books = getAllBooks();
    expect(books).toHaveLength(1);
    expect(books[0].id).toBe("book-2");
  });

  it("is a no-op for nonexistent ID", () => {
    seedCollection([makeBook()]);
    deleteBook("nonexistent");
    expect(getAllBooks()).toHaveLength(1);
  });
});

describe("getRawCollection", () => {
  it("returns the full collection object", () => {
    seedCollection([makeBook()]);
    const raw = getRawCollection();
    expect(raw.version).toBe(1);
    expect(raw.books).toHaveLength(1);
  });
});

describe("clearBooks", () => {
  it("removes all books from storage", () => {
    seedCollection([makeBook(), makeBook({ id: "book-2" })]);
    clearBooks();
    expect(getAllBooks()).toEqual([]);
  });
});
