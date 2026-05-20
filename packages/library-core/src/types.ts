export type ReadingStatus = 'to-read' | 'reading' | 'read';

export interface LibraryBook {
  id: string;
  title: string;
  authors: string[];
  isbn13: string;
  coverUrl?: string;
  publisher?: string;
  publishYear?: number;
  pageCount?: number;
  status?: ReadingStatus;
  rating?: number;
  language?: string;
  notes?: string;
  synopsis?: string;
  tags?: string[];
  dateAdded?: string;
  dateRead?: string;
}

export interface LibraryPayload {
  books: LibraryBook[];
}
