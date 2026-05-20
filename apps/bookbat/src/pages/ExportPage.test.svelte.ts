import { render, screen } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import ExportPage from "./ExportPage.svelte";

const { getBooks, getLibraryName, showToast, getRawCollection, downloadBlob } = vi.hoisted(() => ({
  getBooks: vi.fn(),
  getLibraryName: vi.fn(),
  showToast: vi.fn(),
  getRawCollection: vi.fn(),
  downloadBlob: vi.fn(),
}));

vi.mock("../lib/stores.svelte", () => ({
  getBooks,
  getLibraryName,
  showToast,
}));

vi.mock("../lib/storage", () => ({
  getRawCollection,
}));

vi.mock("../lib/export", () => ({
  generateCsv: vi.fn(() => "csv"),
  generateGoodreadsCsv: vi.fn(() => "gr"),
  generateLibraryThingTsv: vi.fn(() => "lt"),
  downloadBlob,
}));

function makeBook() {
  return {
    id: "b1",
    isbn13: "9780141439518",
    title: "Pride and Prejudice",
    authors: ["Jane Austen"],
    status: "to-read",
    dateAdded: "2025-01-01T00:00:00.000Z",
    source: "openlibrary" as const,
  };
}

function setupLocalStorage() {
  const store: Record<string, string> = {};
  vi.stubGlobal("localStorage", {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, val: string) => {
      store[key] = val;
    }),
  });
}

describe("ExportPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupLocalStorage();
    getBooks.mockReturnValue([makeBook()]);
    getLibraryName.mockReturnValue("Library");
    getRawCollection.mockReturnValue({ version: 1, books: [makeBook()] });
  });

  it("shows validation errors for invalid webhook URL", async () => {
    const user = userEvent.setup();
    vi.stubGlobal("fetch", vi.fn());

    render(ExportPage);
    await user.type(screen.getByPlaceholderText("Apps Script webhook URL..."), "http://invalid");
    await user.click(screen.getByRole("button", { name: "Push" }));

    expect(showToast).toHaveBeenCalledWith("Webhook URL must start with https://");
  });

  it("posts collection to webhook after user confirmation", async () => {
    const user = userEvent.setup();
    const fetchSpy = vi.fn(async () => new Response("ok", { status: 200 }));
    vi.stubGlobal("fetch", fetchSpy);

    render(ExportPage);
    await user.type(
      screen.getByPlaceholderText("Apps Script webhook URL..."),
      "https://script.google.com/macros/s/test/exec",
    );
    await user.click(screen.getByRole("button", { name: "Push" }));
    await user.click(screen.getByRole("button", { name: "Send" }));

    expect(fetchSpy).toHaveBeenCalledWith(
      "https://script.google.com/macros/s/test/exec",
      expect.objectContaining({ method: "POST" }),
    );
    expect(showToast).toHaveBeenCalledWith("Exported 1 books to Google Sheets!");
  });

  it("prefixes exported filename with YYMMDD and includes title count", async () => {
    const user = userEvent.setup();
    const books = Array.from({ length: 55 }, (_, i) => ({ ...makeBook(), id: `b${i}` }));
    getBooks.mockReturnValue(books);
    getRawCollection.mockReturnValue({ version: 1, books });
    getLibraryName.mockReturnValue("MyBooks");
    const now = new Date();
    const expectedPrefix = `${String(now.getFullYear()).slice(-2)}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;

    render(ExportPage);
    await user.click(screen.getByRole("button", { name: /^JSON Raw book data$/i }));

    await vi.waitFor(() => {
      expect(downloadBlob).toHaveBeenCalledWith(
        expect.any(String),
        `${expectedPrefix}-mybooks-55.json`,
        "application/json",
      );
    });
  });
});
