import type { Book } from "./types";

// Persistent, best-effort cache for `lookupIsbn` results, keyed by normalized
// ISBN-13. Backed by localStorage to match the rest of the storage layer
// (the library itself lives in localStorage via storage.ts). Every operation
// swallows storage errors so a disabled/full quota never breaks lookups.

const CACHE_STORAGE_KEY = "bookbat:isbn-lookup-cache:v1";

// Metadata is fairly stable, so positive results live a long time. Missing
// ISBNs get a much shorter TTL so a genuine gap (or a transient API outage
// surfacing as "not found") is retried within a day rather than weeks.
const POSITIVE_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const NEGATIVE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// Bound the cache so it can never grow without limit. On overflow we keep the
// most recently fetched entries (approximate LRU by fetch time).
const MAX_ENTRIES = 500;

export interface IsbnCacheEntry {
  /** The looked-up book, or `null` for a negative (not-found) result. */
  book: Book | null;
  /** Epoch milliseconds when this result was fetched. */
  fetchedAt: number;
}

type CacheMap = Record<string, IsbnCacheEntry>;

function isFresh(entry: IsbnCacheEntry, now: number): boolean {
  if (!entry || typeof entry.fetchedAt !== "number") return false;
  const ttl = entry.book ? POSITIVE_TTL_MS : NEGATIVE_TTL_MS;
  return now - entry.fetchedAt < ttl;
}

function loadMap(): CacheMap {
  try {
    const raw = localStorage.getItem(CACHE_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as CacheMap) : {};
  } catch {
    return {};
  }
}

function saveMap(map: CacheMap): void {
  try {
    localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(map));
  } catch {
    // Storage unavailable or over quota — the cache is best-effort.
  }
}

// Drop expired entries and cap the map at MAX_ENTRIES, keeping the freshest.
function prune(map: CacheMap, now: number): CacheMap {
  let entries = Object.entries(map).filter(([, entry]) => isFresh(entry, now));
  if (entries.length > MAX_ENTRIES) {
    entries = entries.sort((a, b) => b[1].fetchedAt - a[1].fetchedAt).slice(0, MAX_ENTRIES);
  }
  return Object.fromEntries(entries);
}

/**
 * Return the cached entry for an ISBN-13 if present and still within its TTL.
 * Expired entries are treated as a miss (and overwritten on the next write).
 */
export function readIsbnCache(
  isbn13: string,
  now: number = Date.now(),
): IsbnCacheEntry | undefined {
  const entry = loadMap()[isbn13];
  if (!entry || !isFresh(entry, now)) return undefined;
  return entry;
}

/**
 * Store a lookup result (book or `null` negative result) for an ISBN-13.
 * Expired/overflow entries are pruned as a side effect.
 */
export function writeIsbnCache(isbn13: string, book: Book | null, now: number = Date.now()): void {
  const map = loadMap();
  map[isbn13] = { book, fetchedAt: now };
  saveMap(prune(map, now));
}

/** Remove the entire lookup cache. */
export function clearIsbnCache(): void {
  try {
    localStorage.removeItem(CACHE_STORAGE_KEY);
  } catch {
    // Nothing to clean up if storage is unavailable.
  }
}
