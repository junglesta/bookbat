import { render, screen } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import ScanPage from "./ScanPage.svelte";

const { scanIsbn, addBookToCollection, showToast, navigate } = vi.hoisted(() => ({
  scanIsbn: vi.fn(),
  addBookToCollection: vi.fn(),
  showToast: vi.fn(),
  navigate: vi.fn(),
}));

vi.mock("../lib/stores.svelte", () => ({
  scanIsbn,
  addBookToCollection,
  showToast,
  navigate,
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

describe("ScanPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("looks up ISBN and adds the previewed book", async () => {
    scanIsbn.mockResolvedValue({ book: makeBook(), alreadyExists: false });
    addBookToCollection.mockResolvedValue(makeBook());

    const user = userEvent.setup();
    render(ScanPage);

    await user.type(screen.getByPlaceholderText("978-3-161484-10-0"), "9780141439518");
    await user.click(screen.getByRole("button", { name: "ISBN-13" }));

    await screen.findByRole("button", { name: "Add to Library" });
    await user.click(screen.getByRole("button", { name: "Add to Library" }));

    expect(scanIsbn).toHaveBeenCalledWith("9780141439518");
    expect(addBookToCollection).toHaveBeenCalledWith(
      expect.objectContaining({ isbn13: "9780141439518" }),
    );
    await screen.findByText("Added to library");
  });

  it("shows existing-book actions and navigates to library", async () => {
    scanIsbn.mockResolvedValue({ book: makeBook(), alreadyExists: true });

    const user = userEvent.setup();
    render(ScanPage);

    await user.type(screen.getByPlaceholderText("978-3-161484-10-0"), "9780141439518");
    await user.click(screen.getByRole("button", { name: "ISBN-13" }));

    const viewBtn = await screen.findByRole("button", { name: "View in Library" });
    await user.click(viewBtn);

    expect(showToast).toHaveBeenCalledWith("This book is already in your library.");
    expect(navigate).toHaveBeenCalledWith("#/library");
  });

  it("allows scanning the same ISBN again after clicking Scan Another", async () => {
    scanIsbn.mockResolvedValue({ book: makeBook(), alreadyExists: false });
    addBookToCollection.mockResolvedValue(makeBook());

    const user = userEvent.setup();
    render(ScanPage);

    await user.type(screen.getByPlaceholderText("978-3-161484-10-0"), "9780141439518");
    await user.click(screen.getByRole("button", { name: "ISBN-13" }));
    await user.click(await screen.findByRole("button", { name: "Add to Library" }));
    await user.click(await screen.findByRole("button", { name: "Scan Another" }));

    await user.type(screen.getByPlaceholderText("978-3-161484-10-0"), "9780141439518");
    await user.click(screen.getByRole("button", { name: "ISBN-13" }));

    expect(scanIsbn).toHaveBeenCalledTimes(2);
  });
});
