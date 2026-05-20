export interface Book {
  id: string;
  isbn13: string;
  isbn10?: string;
  title: string;
  authors: string[];
  publisher?: string;
  publishDate?: string;
  publishYear?: number;
  pageCount?: number;
  language?: string;
  subjects?: string[];
  synopsis?: string;
  coverUrl?: string;
  rating?: number;
  status: "to-read" | "reading" | "read";
  notes?: string;
  tags?: string[];
  dateAdded: string;
  dateRead?: string;
  source: "openlibrary" | "googlebooks" | "manual";
}

export interface BookCollection {
  version: 1;
  books: Book[];
}

export interface ScanResult {
  book: Book;
  alreadyExists: boolean;
}
