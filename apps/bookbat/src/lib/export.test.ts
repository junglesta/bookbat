import {
  generateBookText,
  generateCsv,
  generateGoodreadsCsv,
  generateLibraryThingTsv,
} from "./export";
import type { Book } from "./types";

function makeBook(overrides: Partial<Book> = {}): Book {
  return {
    id: "1",
    isbn13: "9780141439518",
    isbn10: "0141439513",
    title: "Pride and Prejudice",
    authors: ["Jane Austen"],
    publisher: "Penguin Classics",
    publishDate: "2002-12-31",
    publishYear: 2002,
    pageCount: 480,
    language: "en",
    status: "read",
    rating: 5,
    dateAdded: "2025-06-15T12:00:00.000Z",
    dateRead: "2025-07-01T12:00:00.000Z",
    tags: ["classic", "romance"],
    notes: "A masterpiece",
    source: "openlibrary",
    ...overrides,
  };
}

describe("generateCsv", () => {
  it("produces correct header row", () => {
    const csv = generateCsv([]);
    expect(csv).toBe(
      "Title,Authors,ISBN-13,ISBN-10,Publisher,Publish Date,Year,Pages,Language,Status,Rating,Date Added,Date Read,Tags,Notes",
    );
  });

  it("produces correct data for a complete book", () => {
    const lines = generateCsv([makeBook()]).split("\n");
    expect(lines).toHaveLength(2);
    expect(lines[1]).toContain("Pride and Prejudice");
    expect(lines[1]).toContain("Jane Austen");
    expect(lines[1]).toContain("9780141439518");
    expect(lines[1]).toContain("read");
  });

  it("handles missing optional fields", () => {
    const book = makeBook({
      isbn10: undefined,
      publisher: undefined,
      notes: undefined,
      tags: undefined,
    });
    const lines = generateCsv([book]).split("\n");
    expect(lines).toHaveLength(2);
  });

  it("escapes commas in values", () => {
    const book = makeBook({ title: "Hello, World" });
    const csv = generateCsv([book]);
    expect(csv).toContain('"Hello, World"');
  });

  it("escapes double quotes in values", () => {
    const book = makeBook({ title: 'The "Best" Book' });
    const csv = generateCsv([book]);
    expect(csv).toContain('"The ""Best"" Book"');
  });

  it("joins multiple authors with semicolons", () => {
    const book = makeBook({ authors: ["Author One", "Author Two"] });
    const csv = generateCsv([book]);
    expect(csv).toContain("Author One; Author Two");
  });

  it("neutralizes formula-like values", () => {
    const book = makeBook({ title: '=HYPERLINK("http://evil")' });
    const csv = generateCsv([book]);
    expect(csv).toContain("'=HYPERLINK");
  });
});

describe("generateGoodreadsCsv", () => {
  it("maps status to Goodreads shelf names", () => {
    const toRead = generateGoodreadsCsv([makeBook({ status: "to-read" })]);
    expect(toRead).toContain("to-read");

    const reading = generateGoodreadsCsv([makeBook({ status: "reading" })]);
    expect(reading).toContain("currently-reading");

    const read = generateGoodreadsCsv([makeBook({ status: "read" })]);
    const lines = read.split("\n");
    // "read" appears in the shelf column of the data row
    expect(lines[1]).toMatch(/,read,/);
  });

  it('wraps ISBNs with ="..."', () => {
    const csv = generateGoodreadsCsv([makeBook()]);
    expect(csv).toContain('="0141439513"');
    expect(csv).toContain('="9780141439518"');
  });

  it("uses first author only", () => {
    const book = makeBook({ authors: ["First Author", "Second Author"] });
    const csv = generateGoodreadsCsv([book]);
    expect(csv).toContain("First Author");
    expect(csv).not.toContain("Second Author");
  });

  it("defaults rating to 0 when missing", () => {
    const book = makeBook({ rating: undefined });
    const lines = generateGoodreadsCsv([book]).split("\n");
    // Rating is the 5th column (index 4)
    const cols = lines[1].split(",");
    expect(cols[4]).toBe("0");
  });

  it("neutralizes dangerous review text", () => {
    const book = makeBook({ notes: "+SUM(1,1)" });
    const csv = generateGoodreadsCsv([book]);
    expect(csv).toContain("'+SUM(1,1)");
  });

  it("uses blank date cells for invalid date values", () => {
    const csv = generateGoodreadsCsv([
      makeBook({ dateAdded: "not-a-date", dateRead: "not-a-date" }),
    ]);
    const cols = csv.split("\n")[1].split(",");
    // Date Read, Date Added
    expect(cols[7]).toBe("");
    expect(cols[8]).toBe("");
  });
});

describe("generateLibraryThingTsv", () => {
  it("uses tab separators", () => {
    const tsv = generateLibraryThingTsv([makeBook()]);
    const lines = tsv.split("\n");
    expect(lines[0].split("\t").length).toBeGreaterThan(1);
    expect(lines[1].split("\t").length).toBeGreaterThan(1);
  });

  it("formats dateAdded as YYYY-MM-DD", () => {
    const tsv = generateLibraryThingTsv([makeBook()]);
    expect(tsv).toContain("2025-06-15");
  });

  it("joins tags with comma-space", () => {
    const tsv = generateLibraryThingTsv([makeBook()]);
    expect(tsv).toContain("classic, romance");
  });

  it("formats dateRead as YYYY-MM-DD", () => {
    const tsv = generateLibraryThingTsv([makeBook()]);
    expect(tsv).toContain("2025-07-01");
  });

  it("neutralizes formula-like cells", () => {
    const tsv = generateLibraryThingTsv([makeBook({ title: "  =1+1" })]);
    expect(tsv).toContain("'  =1+1");
  });
});

describe("generateBookText", () => {
  it("formats the most important single-book fields as plain text", () => {
    const text = generateBookText(
      makeBook({
        title: "Contemporary Melbourne architecture",
        authors: ["Joe Rollo"],
        publisher: "UNSW Press",
        publishYear: 1999,
        pageCount: 192,
        isbn13: "9780868405469",
      }),
    );

    expect(text).toBe(
      [
        "Contemporary Melbourne architecture",
        "Joe Rollo",
        "UNSW Press",
        "1999",
        "192 pages",
        "ISBN: 9780868405469",
      ].join("\n"),
    );
  });

  it("includes synopsis only when present", () => {
    const text = generateBookText(
      makeBook({
        synopsis: "A concise synopsis.",
      }),
    );

    expect(text).toContain("A concise synopsis.");
  });
});
