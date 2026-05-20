import { cleanIsbn, isValidIsbn, toIsbn13 } from "./isbn";
import type { Book, ScanResult } from "./types";

export interface ScanDeps {
  findByIsbn13: (isbn13: string) => Book | undefined;
  lookupByIsbn: (isbn: string) => Promise<Book | null>;
}

export async function scanIsbnWithDeps(isbn: string, deps: ScanDeps): Promise<ScanResult> {
  const cleaned = cleanIsbn(isbn);
  if (!isValidIsbn(cleaned)) {
    throw new Error("Invalid ISBN format");
  }

  const normalizedIsbn13 = toIsbn13(cleaned);
  if (!normalizedIsbn13) {
    throw new Error("Invalid ISBN format");
  }

  const existing = deps.findByIsbn13(normalizedIsbn13);
  if (existing) {
    return { book: existing, alreadyExists: true };
  }

  const book = await deps.lookupByIsbn(cleaned);
  if (!book) {
    throw new Error("Book not found");
  }

  return { book, alreadyExists: false };
}
