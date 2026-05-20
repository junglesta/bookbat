import { lookupIsbn } from "./isbn-lookup";

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
});

function mockOpenLibrary(
  data: Record<string, unknown> = {},
  authorName = "Test Author",
  subjects: string[] = [],
) {
  fetchMock.mockImplementation((url: string) => {
    if (url.includes("openlibrary.org/isbn/")) {
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            title: "Test Book",
            authors: [{ key: "/authors/OL123A" }],
            publishers: ["Test Publisher"],
            publish_date: "2020",
            number_of_pages: 300,
            isbn_10: ["0141439513"],
            covers: [12345],
            languages: [{ key: "/languages/eng" }],
            works: [{ key: "/works/OL123W" }],
            ...data,
          }),
      });
    }
    if (url.includes("openlibrary.org/authors/")) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ name: authorName }),
      });
    }
    if (url.includes("openlibrary.org/works/")) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ subjects }),
      });
    }
    return Promise.resolve({ ok: false });
  });
}

function _mockOpenLibraryFail() {
  fetchMock.mockImplementation((url: string) => {
    if (url.includes("openlibrary.org/")) {
      return Promise.resolve({ ok: false });
    }
    return Promise.resolve({ ok: false });
  });
}

function mockGoogleBooks(vol: Record<string, unknown> = {}) {
  return Promise.resolve({
    ok: true,
    json: () =>
      Promise.resolve({
        items: [
          {
            volumeInfo: {
              title: "Google Book",
              authors: ["Google Author"],
              publisher: "Google Pub",
              publishedDate: "2021",
              pageCount: 200,
              language: "en",
              industryIdentifiers: [{ type: "ISBN_10", identifier: "0141439513" }],
              ...vol,
            },
          },
        ],
      }),
  });
}

describe("lookupIsbn", () => {
  it("returns book from Open Library when successful", async () => {
    mockOpenLibrary();
    const book = await lookupIsbn("9780141439518");
    expect(book).not.toBeNull();
    expect(book?.title).toBe("Test Book");
    expect(book?.source).toBe("openlibrary");
  });

  it("resolves author names from Open Library", async () => {
    mockOpenLibrary({}, "Jane Austen");
    const book = await lookupIsbn("9780141439518");
    expect(book?.authors).toEqual(["Jane Austen"]);
  });

  it("extracts cover URL", async () => {
    mockOpenLibrary();
    const book = await lookupIsbn("9780141439518");
    expect(book?.coverUrl).toBe("https://covers.openlibrary.org/b/id/12345-L.jpg");
  });

  it("extracts language", async () => {
    mockOpenLibrary();
    const book = await lookupIsbn("9780141439518");
    expect(book?.language).toBe("eng");
  });

  it("extracts subjects from works endpoint", async () => {
    mockOpenLibrary({}, "Author", ["Fiction", "Classic"]);
    const book = await lookupIsbn("9780141439518");
    expect(book?.subjects).toEqual(["Fiction", "Classic"]);
  });

  it("extracts synopsis from Open Library work description", async () => {
    fetchMock.mockImplementation((url: string) => {
      if (url.includes("openlibrary.org/isbn/")) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              title: "Test Book",
              authors: [{ key: "/authors/OL123A" }],
              works: [{ key: "/works/OL123W" }],
            }),
        });
      }
      if (url.includes("openlibrary.org/authors/")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ name: "Author" }),
        });
      }
      if (url.includes("openlibrary.org/works/")) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              description: { value: "A classic synopsis from Open Library." },
            }),
        });
      }
      return Promise.resolve({ ok: false });
    });

    const book = await lookupIsbn("9780141439518");
    expect(book?.synopsis).toBe("A classic synopsis from Open Library.");
  });

  it("fills synopsis from Open Library search when missing from ISBN lookup", async () => {
    fetchMock.mockImplementation((url: string) => {
      if (url.includes("openlibrary.org/isbn/")) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              title: "Search Me",
              authors: [{ key: "/authors/OL123A" }],
              works: [],
            }),
        });
      }
      if (url.includes("openlibrary.org/authors/")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ name: "Author Name" }),
        });
      }
      if (url.includes("openlibrary.org/search.json")) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              docs: [{ key: "/works/OL999W" }],
            }),
        });
      }
      if (url.includes("openlibrary.org/works/OL999W.json")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ description: "Synopsis via search fallback." }),
        });
      }
      if (url.includes("googleapis.com/books/")) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              items: [{ volumeInfo: { language: "en" } }],
            }),
        });
      }
      return Promise.resolve({ ok: false });
    });

    const book = await lookupIsbn("9780141439518");
    expect(book?.source).toBe("openlibrary");
    expect(book?.synopsis).toBe("Synopsis via search fallback.");
  });

  it("extracts publish year from date string", async () => {
    mockOpenLibrary({ publish_date: "March 15, 2020" });
    const book = await lookupIsbn("9780141439518");
    expect(book?.publishYear).toBe(2020);
  });

  it("falls back to Google Books when Open Library fails", async () => {
    fetchMock.mockImplementation((url: string) => {
      if (url.includes("openlibrary.org/")) {
        return Promise.resolve({ ok: false });
      }
      if (url.includes("googleapis.com/books/")) {
        return mockGoogleBooks();
      }
      return Promise.resolve({ ok: false });
    });

    const book = await lookupIsbn("9780141439518");
    expect(book).not.toBeNull();
    expect(book?.title).toBe("Google Book");
    expect(book?.source).toBe("googlebooks");
  });

  it("normalizes Google Books thumbnail URL to https", async () => {
    fetchMock.mockImplementation((url: string) => {
      if (url.includes("openlibrary.org/")) {
        return Promise.resolve({ ok: false });
      }
      if (url.includes("googleapis.com/books/")) {
        return mockGoogleBooks({
          imageLinks: { thumbnail: "http://books.google.test/cover.jpg" },
        });
      }
      return Promise.resolve({ ok: false });
    });

    const book = await lookupIsbn("9780141439518");
    expect(book?.coverUrl).toBe("https://books.google.test/cover.jpg");
  });

  it("extracts synopsis from Google Books when falling back", async () => {
    fetchMock.mockImplementation((url: string) => {
      if (url.includes("openlibrary.org/")) {
        return Promise.resolve({ ok: false });
      }
      if (url.includes("googleapis.com/books/")) {
        return mockGoogleBooks({
          description: "Google Books synopsis.",
        });
      }
      return Promise.resolve({ ok: false });
    });

    const book = await lookupIsbn("9780141439518");
    expect(book?.source).toBe("googlebooks");
    expect(book?.synopsis).toBe("Google Books synopsis.");
  });

  it("fills Google Books synopsis from Open Library search when missing", async () => {
    fetchMock.mockImplementation((url: string) => {
      if (url.includes("openlibrary.org/isbn/")) {
        return Promise.resolve({ ok: false });
      }
      if (url.includes("googleapis.com/books/")) {
        return mockGoogleBooks({
          title: "GB Search Me",
          authors: ["GB Author"],
          description: "",
        });
      }
      if (url.includes("openlibrary.org/search.json")) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              docs: [{ key: "/works/OL777W" }],
            }),
        });
      }
      if (url.includes("openlibrary.org/works/OL777W.json")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ description: { value: "GB synopsis via OL search." } }),
        });
      }
      return Promise.resolve({ ok: false });
    });

    const book = await lookupIsbn("9780141439518");
    expect(book?.source).toBe("googlebooks");
    expect(book?.synopsis).toBe("GB synopsis via OL search.");
  });

  it("returns null when both APIs fail", async () => {
    fetchMock.mockResolvedValue({ ok: false });
    const book = await lookupIsbn("9780141439518");
    expect(book).toBeNull();
  });

  it("strips hyphens from ISBN input", async () => {
    mockOpenLibrary();
    await lookupIsbn("978-0-14-143951-8");
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("9780141439518"),
      expect.objectContaining({ signal: expect.any(Object) }),
    );
  });

  it("fetches Google Books language when OL has none", async () => {
    fetchMock.mockImplementation((url: string) => {
      if (url.includes("openlibrary.org/isbn/")) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              title: "No Lang Book",
              authors: [],
              works: [],
            }),
        });
      }
      if (url.includes("googleapis.com/books/")) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              items: [{ volumeInfo: { language: "fr" } }],
            }),
        });
      }
      return Promise.resolve({ ok: false });
    });

    const book = await lookupIsbn("9780141439518");
    expect(book?.language).toBe("fr");
  });

  it("converts ISBN-10 to ISBN-13", async () => {
    mockOpenLibrary();
    const book = await lookupIsbn("0141439513");
    expect(book?.isbn13).toBe("9780141439518");
  });
});
