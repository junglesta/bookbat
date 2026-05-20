import { scanIsbnWithDeps } from "./scan";
import type { Book } from "./types";

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

describe("scanIsbnWithDeps", () => {
  it("rejects invalid ISBN", async () => {
    await expect(
      scanIsbnWithDeps("123", {
        findByIsbn13: () => undefined,
        lookupByIsbn: async () => null,
      }),
    ).rejects.toThrow("Invalid ISBN format");
  });

  it("returns alreadyExists when present in collection", async () => {
    const existing = makeBook();
    const lookupByIsbn = vi.fn(async () => null);
    const result = await scanIsbnWithDeps("9780141439518", {
      findByIsbn13: () => existing,
      lookupByIsbn,
    });
    expect(result.alreadyExists).toBe(true);
    expect(result.book.id).toBe(existing.id);
    expect(lookupByIsbn).not.toHaveBeenCalled();
  });

  it("returns looked up book when not already present", async () => {
    const lookedUp = makeBook({ id: "lookup-1" });
    const result = await scanIsbnWithDeps("9780141439518", {
      findByIsbn13: () => undefined,
      lookupByIsbn: async () => lookedUp,
    });
    expect(result.alreadyExists).toBe(false);
    expect(result.book.id).toBe("lookup-1");
  });

  it("throws when remote lookup fails", async () => {
    await expect(
      scanIsbnWithDeps("9780141439518", {
        findByIsbn13: () => undefined,
        lookupByIsbn: async () => null,
      }),
    ).rejects.toThrow("Book not found");
  });
});
