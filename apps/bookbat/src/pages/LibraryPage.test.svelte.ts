import { fireEvent, render, screen, within } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import type { Book } from "../lib/types";
import LibraryPage from "./LibraryPage.svelte";

const {
  getBooks,
  isLoading,
  loadBooks,
  getLibraryName,
  setLibraryName,
  updateBookInCollection,
  removeBookFromCollection,
  clearLibraryCollection,
  importBooksToCollection,
  showToast,
} = vi.hoisted(() => ({
  getBooks: vi.fn(),
  isLoading: vi.fn(),
  loadBooks: vi.fn(),
  getLibraryName: vi.fn(),
  setLibraryName: vi.fn(),
  updateBookInCollection: vi.fn(),
  removeBookFromCollection: vi.fn(),
  clearLibraryCollection: vi.fn(),
  importBooksToCollection: vi.fn(),
  showToast: vi.fn(),
}));

const { lookupIsbn } = vi.hoisted(() => ({
  lookupIsbn: vi.fn(),
}));

vi.mock("../lib/stores.svelte.ts", () => ({
  getBooks,
  isLoading,
  loadBooks,
  getLibraryName,
  setLibraryName,
  updateBookInCollection,
  removeBookFromCollection,
  clearLibraryCollection,
  importBooksToCollection,
  showToast,
}));

vi.mock("../lib/isbn-lookup", () => ({
  lookupIsbn,
}));

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

describe("LibraryPage", () => {
  let booksState: Book[];

  beforeEach(() => {
    vi.clearAllMocks();
    isLoading.mockReturnValue(false);
    getLibraryName.mockReturnValue("Library");
    booksState = [makeBook()];
    getBooks.mockImplementation(() => booksState);
    updateBookInCollection.mockImplementation(async (id: string, updates: Partial<Book>) => {
      const index = booksState.findIndex((book) => book.id === id);
      const updated = { ...booksState[index], ...updates };
      booksState = booksState.map((book) => (book.id === id ? updated : book));
      return updated;
    });
    removeBookFromCollection.mockResolvedValue(undefined);
    clearLibraryCollection.mockImplementation(() => {});
    importBooksToCollection.mockReturnValue({
      total: 0,
      added: 0,
      merged: 0,
      skipped: 0,
      failed: 0,
    });
    lookupIsbn.mockResolvedValue(null);
  });

  it("loads books on mount and opens detail when selecting a book", async () => {
    const user = userEvent.setup();
    render(LibraryPage);

    expect(loadBooks).toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: /Pride and Prejudice/i }));
    expect(screen.getByLabelText("Book details")).toBeTruthy();
  });

  it("saves updated status from detail modal", async () => {
    const user = userEvent.setup();
    render(LibraryPage);

    await user.click(screen.getByRole("button", { name: /Pride and Prejudice/i }));
    const modal = screen.getByLabelText("Book details");
    await user.click(within(modal).getByRole("button", { name: "Read" }));
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(updateBookInCollection).toHaveBeenCalledWith(
      "book-1",
      expect.objectContaining({ status: "read" }),
    );
  });

  it("backfills synopsis in background when missing", async () => {
    const user = userEvent.setup();
    lookupIsbn.mockResolvedValue(makeBook({ synopsis: "Recovered synopsis." }));
    render(LibraryPage);

    await user.click(screen.getByRole("button", { name: /Pride and Prejudice/i }));

    await vi.waitFor(() => {
      expect(updateBookInCollection).toHaveBeenCalledWith(
        "book-1",
        { synopsis: "Recovered synopsis." },
        { silent: true },
      );
    });

    expect(await screen.findByText("Recovered synopsis.")).toBeTruthy();
  });

  it("removes a book after confirmation", async () => {
    const user = userEvent.setup();

    render(LibraryPage);
    await user.click(screen.getByRole("button", { name: /Pride and Prejudice/i }));
    await user.click(screen.getByRole("button", { name: "Remove" }));
    await user.click(screen.getByRole("button", { name: "Delete" }));

    expect(removeBookFromCollection).toHaveBeenCalledWith("book-1");
  });

  it("drops the whole library after confirmation", async () => {
    const user = userEvent.setup();

    render(LibraryPage);
    await user.click(screen.getByRole("button", { name: "Drop library" }));
    await user.click(screen.getByRole("button", { name: "Delete" }));

    expect(clearLibraryCollection).toHaveBeenCalled();
  });

  it("shows inline RBAND error for unsupported import file type", async () => {
    const { container } = render(LibraryPage);
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(["hello"], "notes.txt", { type: "text/plain" });

    Object.defineProperty(input, "files", {
      value: [file],
      configurable: true,
    });
    await fireEvent.change(input);

    expect(screen.getByText("Import Error")).toBeTruthy();
    expect(screen.getByText(/Unsupported file type \(notes\.txt\)\. Use/i)).toBeTruthy();
    expect(showToast).not.toHaveBeenCalledWith(expect.stringContaining("Unsupported file type"));
  });
});
