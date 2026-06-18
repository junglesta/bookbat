import { beforeEach, describe, expect, it } from "vitest";
import { clearIsbnCache, readIsbnCache, writeIsbnCache } from "./isbn-cache";
import type { Book } from "./types";

const DAY = 24 * 60 * 60 * 1000;
const STORAGE_KEY = "bookbat:isbn-lookup-cache:v1";

function makeBook(isbn13 = "9780141439518"): Book {
  return {
    id: "",
    isbn13,
    title: "Test Book",
    authors: ["Test Author"],
    status: "to-read",
    dateAdded: "",
    source: "openlibrary",
  };
}

beforeEach(() => {
  localStorage.clear();
});

describe("isbn cache", () => {
  it("returns undefined on a miss", () => {
    expect(readIsbnCache("9780141439518", 1000)).toBeUndefined();
  });

  it("stores and returns a positive result", () => {
    const book = makeBook();
    writeIsbnCache(book.isbn13, book, 1000);
    expect(readIsbnCache(book.isbn13, 1000)?.book).toEqual(book);
  });

  it("expires positive results after 30 days", () => {
    const book = makeBook();
    writeIsbnCache(book.isbn13, book, 0);
    expect(readIsbnCache(book.isbn13, 30 * DAY - 1)?.book).toEqual(book);
    expect(readIsbnCache(book.isbn13, 30 * DAY + 1)).toBeUndefined();
  });

  it("stores negative results with a shorter 24h TTL", () => {
    writeIsbnCache("9780141439518", null, 0);
    const hit = readIsbnCache("9780141439518", DAY - 1);
    expect(hit).toBeDefined();
    expect(hit?.book).toBeNull();
    expect(readIsbnCache("9780141439518", DAY + 1)).toBeUndefined();
  });

  it("evicts the oldest entry once past the size cap", () => {
    // Cap is 500; writing 501 entries should evict the oldest (lowest fetchedAt).
    for (let i = 0; i <= 500; i++) {
      writeIsbnCache(`isbn-${i}`, makeBook(`isbn-${i}`), 1000 + i);
    }
    expect(readIsbnCache("isbn-0", 2000)).toBeUndefined();
    expect(readIsbnCache("isbn-500", 2000)?.book?.isbn13).toBe("isbn-500");
  });

  it("clears the whole cache", () => {
    writeIsbnCache("9780141439518", makeBook(), 1000);
    clearIsbnCache();
    expect(readIsbnCache("9780141439518", 1000)).toBeUndefined();
  });

  it("treats corrupt storage as a miss instead of throwing", () => {
    localStorage.setItem(STORAGE_KEY, "{not valid json");
    expect(() => readIsbnCache("9780141439518", 1000)).not.toThrow();
    expect(readIsbnCache("9780141439518", 1000)).toBeUndefined();
  });
});
