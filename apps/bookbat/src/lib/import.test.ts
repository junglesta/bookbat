import { parseImportedBooks } from "./import";

describe("parseImportedBooks", () => {
  it("parses JSON array input", () => {
    const books = parseImportedBooks(
      JSON.stringify([
        {
          isbn13: "9780141439518",
          title: "Pride and Prejudice",
          authors: ["Jane Austen"],
          status: "read",
        },
      ]),
      "books.json",
    );

    expect(books).toHaveLength(1);
    expect(books[0].isbn13).toBe("9780141439518");
    expect(books[0].status).toBe("read");
  });

  it("parses collection JSON shape", () => {
    const books = parseImportedBooks(
      JSON.stringify({
        version: 1,
        books: [
          { isbn13: "9780141439518", title: "Pride and Prejudice", authors: ["Jane Austen"] },
        ],
      }),
      "library.json",
    );
    expect(books).toHaveLength(1);
  });

  it("parses CSV export rows", () => {
    const csv = [
      "Title,Authors,ISBN-13,ISBN-10,Publisher,Publish Date,Year,Pages,Language,Status,Rating,Date Added,Date Read,Tags,Notes",
      'Pride and Prejudice,Jane Austen,9780141439518,0141439513,Penguin,2002,2002,480,en,to-read,5,2025-01-01,,"Classic; Romance",Favorite',
    ].join("\n");
    const books = parseImportedBooks(csv, "library.csv");

    expect(books).toHaveLength(1);
    expect(books[0].title).toBe("Pride and Prejudice");
    expect(books[0].authors).toEqual(["Jane Austen"]);
    expect(books[0].tags).toEqual(["Classic", "Romance"]);
  });

  it("normalizes ISBN-10 to ISBN-13", () => {
    const books = parseImportedBooks(
      JSON.stringify([
        { isbn13: "0141439513", title: "Pride and Prejudice", authors: ["Jane Austen"] },
      ]),
      "books.json",
    );
    expect(books[0].isbn13).toBe("9780141439518");
  });

  it("preserves coverUrl from JSON import", () => {
    const books = parseImportedBooks(
      JSON.stringify([
        {
          isbn13: "9780141439518",
          title: "Pride and Prejudice",
          authors: ["Jane Austen"],
          coverUrl: "https://covers.openlibrary.org/b/id/12345-L.jpg",
        },
      ]),
      "books.json",
    );
    expect(books[0].coverUrl).toBe("https://covers.openlibrary.org/b/id/12345-L.jpg");
  });

  it("preserves synopsis from JSON import", () => {
    const books = parseImportedBooks(
      JSON.stringify([
        {
          isbn13: "9780141439518",
          title: "Pride and Prejudice",
          authors: ["Jane Austen"],
          synopsis: "A quick synopsis.",
        },
      ]),
      "books.json",
    );
    expect(books[0].synopsis).toBe("A quick synopsis.");
  });

  it("derives coverUrl from Open Library cover id fields", () => {
    const books = parseImportedBooks(
      JSON.stringify([
        {
          isbn13: "9780141439518",
          title: "Pride and Prejudice",
          authors: ["Jane Austen"],
          cover_i: 54321,
        },
      ]),
      "books.json",
    );
    expect(books[0].coverUrl).toBe("https://covers.openlibrary.org/b/id/54321-L.jpg");
  });

  it("normalizes http thumbnail URLs to https", () => {
    const books = parseImportedBooks(
      JSON.stringify([
        {
          isbn13: "9780141439518",
          title: "Pride and Prejudice",
          authors: ["Jane Austen"],
          imageLinks: { thumbnail: "http://books.example/cover.jpg" },
        },
      ]),
      "books.json",
    );
    expect(books[0].coverUrl).toBe("https://books.example/cover.jpg");
  });

  it("supports .css extension as CSV fallback", () => {
    const csv = [
      "Title,Authors,ISBN-13,Status",
      "Pride and Prejudice,Jane Austen,9780141439518,to-read",
    ].join("\n");
    const books = parseImportedBooks(csv, "books.css");
    expect(books).toHaveLength(1);
  });

  it("rejects unsupported extension", () => {
    expect(() => parseImportedBooks("{}", "books.txt")).toThrow("Unsupported file type");
  });

  it("rejects invalid JSON content", () => {
    expect(() => parseImportedBooks("{not-json", "books.json")).toThrow("Invalid JSON file");
  });

  it("rejects CSV/CSS without data rows", () => {
    expect(() => parseImportedBooks("Title,Authors,ISBN-13", "books.csv")).toThrow(
      "Invalid CSV/CSS file",
    );
  });
});
