<script lang="ts">
  import type { Book } from '../lib/types';
  import { showToast, updateBookInCollection, removeBookFromCollection, setBookCoverUrl } from '../lib/stores.svelte.ts';
  import { getCoverCandidates } from '../lib/cover';
  import { lookupIsbn } from '../lib/isbn-lookup';
  import { generateBookText } from '../lib/export';

  interface Props {
    book: Book;
    onClose: () => void;
  }

  let { book, onClose }: Props = $props();
  let coverCandidates = $state<string[]>([]);
  let coverIndex = $state(0);
  let coverLoaded = $state(false);

  let status = $state<Book['status']>('to-read');
  let rating = $state(0);
  let language = $state('');
  let notes = $state('');
  let tagsInput = $state('');
  let saving = $state(false);
  let sharingBook = $state(false);
  let copyingBookText = $state(false);
  let copiedBookText = $state(false);
  let copiedBookTextTimer: ReturnType<typeof setTimeout> | null = null;
  let backfillingSynopsis = $state(false);
  let synopsisBackfillAttemptedBookId = $state<string | null>(null);
  let statusOpen = $state(false);
  let removeConfirmOpen = $state(false);

  $effect(() => {
    status = book.status;
    rating = book.rating || 0;
    language = book.language || '';
    notes = book.notes || '';
    tagsInput = (book.tags || []).join(', ');
    coverCandidates = getCoverCandidates(book);
    coverIndex = 0;
    coverLoaded = false;
  });

  $effect(() => {
    if (book.synopsis) return;
    if (backfillingSynopsis) return;
    if (synopsisBackfillAttemptedBookId === book.id) return;
    synopsisBackfillAttemptedBookId = book.id;
    void backfillSynopsis(book.id, book.isbn13);
  });

  const statusOptions: { value: Book['status']; label: string }[] = [
    { value: 'to-read', label: 'To Read' },
    { value: 'reading', label: 'Reading' },
    { value: 'read', label: 'Read' },
  ];

  function normalizeText(value: string): string | undefined {
    const trimmed = value.trim();
    return trimmed ? trimmed : undefined;
  }

  function normalizeTags(value: string): string[] | undefined {
    const tags = value
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    return tags.length > 0 ? tags : undefined;
  }

  function sameStringArray(a: string[] | undefined, b: string[] | undefined): boolean {
    if (!a && !b) return true;
    if (!a || !b) return false;
    if (a.length !== b.length) return false;
    return a.every((value, index) => value === b[index]);
  }

  const hasChanges = $derived.by(() => {
    const nextRating = rating || undefined;
    const nextLanguage = normalizeText(language);
    const nextNotes = normalizeText(notes);
    const nextTags = normalizeTags(tagsInput);

    return (
      status !== book.status ||
      nextRating !== book.rating ||
      nextLanguage !== book.language ||
      nextNotes !== book.notes ||
      !sameStringArray(nextTags, book.tags)
    );
  });

  const canNativeShare = $derived.by(
    () => typeof navigator !== 'undefined' && typeof navigator.share === 'function',
  );

  function pickStatus(value: Book['status']) {
    status = value;
    statusOpen = false;
  }

  async function save() {
    saving = true;
    try {
      await updateBookInCollection(book.id, {
        status,
        rating: rating || undefined,
        language: normalizeText(language),
        notes: normalizeText(notes),
        tags: normalizeTags(tagsInput),
        dateRead: status === 'read' && !book.dateRead ? new Date().toISOString() : book.dateRead,
      });
      onClose();
    } finally {
      saving = false;
    }
  }

  async function backfillSynopsis(bookId: string, isbn13: string) {
    backfillingSynopsis = true;
    try {
      const lookedUp = await lookupIsbn(isbn13);
      const synopsis = lookedUp?.synopsis?.trim();
      if (!synopsis) return;
      book = await updateBookInCollection(bookId, { synopsis }, { silent: true });
    } catch {
      // ignore background enrichment failures
    } finally {
      backfillingSynopsis = false;
    }
  }

  function isShareAbortError(error: unknown): boolean {
    return typeof error === 'object' && error !== null && 'name' in error && error.name === 'AbortError';
  }

  async function shareBook() {
    if (!canNativeShare || sharingBook) return;
    sharingBook = true;
    try {
      await navigator.share({
        title: book.title,
        text: generateBookText(book),
      });
    } catch (error: unknown) {
      if (!isShareAbortError(error)) {
        showToast('Could not share book.');
      }
    } finally {
      sharingBook = false;
    }
  }

  async function copyBookText() {
    if (copyingBookText) return;
    copyingBookText = true;
    try {
      await navigator.clipboard.writeText(generateBookText(book));
      copiedBookText = true;
      if (copiedBookTextTimer) clearTimeout(copiedBookTextTimer);
      copiedBookTextTimer = setTimeout(() => {
        copiedBookText = false;
        copiedBookTextTimer = null;
      }, 1200);
    } catch {
      showToast('Could not copy book text.');
    } finally {
      copyingBookText = false;
    }
  }

  function remove() {
    removeConfirmOpen = !removeConfirmOpen;
  }

  function cancelRemove() {
    removeConfirmOpen = false;
  }

  async function confirmRemove() {
    await removeBookFromCollection(book.id);
    removeConfirmOpen = false;
    onClose();
  }

  function tryNextCover() {
    coverLoaded = false;
    if (coverIndex < coverCandidates.length - 1) {
      coverIndex += 1;
    } else {
      coverIndex = -1;
    }
  }

  function handleCoverLoaded() {
    const loadedUrl = coverCandidates[coverIndex];
    if (loadedUrl && book.coverUrl !== loadedUrl) {
      setBookCoverUrl(book.id, loadedUrl);
    }
    coverLoaded = true;
  }
</script>

<details class="detail_overlay detail_inline" open aria-label="Book details">
  <summary class="detail_inline_summary">Book details</summary>
  <div class="detail_panel">
    <div class="detail_topbar">
      <button class="detail_close" onclick={onClose} aria-label="Close">&times;</button>
    </div>

    <div class="detail_header">
      <div class="detail_cover">
        {#if coverIndex >= 0 && coverCandidates[coverIndex]}
          {#if !coverLoaded}
            <div class="cover_placeholder large">
              <svg
                class="cover_placeholder_icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
            </div>
          {/if}
          <img
            class:cover_img_loaded={coverLoaded}
            src={coverCandidates[coverIndex]}
            alt={book.title}
            referrerpolicy="no-referrer"
            onload={handleCoverLoaded}
            onerror={tryNextCover}
          />
        {:else}
          <div class="cover_placeholder large">
            <svg
              class="cover_placeholder_icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
          </div>
        {/if}
      </div>
      <div class="detail_title_area">
        <h2>{book.title}</h2>
        <p class="detail_authors">{book.authors.join(', ')}</p>
        {#if book.publisher}
          <p class="detail_publisher">{book.publisher}</p>
        {/if}
        {#if book.publishYear}
          <p class="detail_year">{book.publishYear}</p>
        {/if}
        {#if book.pageCount}
          <p class="detail_pages">{book.pageCount} pages</p>
        {/if}
        <p class="detail_isbn">ISBN: {book.isbn13}</p>
        {#if book.synopsis}
          <p class="detail_synopsis">{book.synopsis}</p>
        {/if}
      </div>
    </div>

    <div class="detail_form">
      <div class="form_group">
        <span>Status</span>
        <div class="status_picker">
          {#each statusOptions as opt}
            <button
              type="button"
              class="status_choice"
              class:active={status === opt.value}
              onclick={() => pickStatus(opt.value)}
            >{opt.label}</button>
          {/each}
        </div>
      </div>

      <div class="form_group">
        <span>Rating</span>
        <div class="rating_input">
          {#each [1, 2, 3, 4, 5] as star}
            <button
              type="button"
              class="star_btn"
              class:active={star <= rating}
              onclick={() => (rating = rating === star ? 0 : star)}
              aria-label="{star} star{star > 1 ? 's' : ''}"
            >★</button>
          {/each}
        </div>
      </div>

      <label class="form_group">
        <span>Language</span>
        <input type="text" bind:value={language} placeholder="eng, it, fr..." />
      </label>

      <label class="form_group">
        <span>Notes</span>
        <textarea bind:value={notes} rows="3" placeholder="Your thoughts..."></textarea>
      </label>

      <label class="form_group">
        <span>Tags</span>
        <input type="text" bind:value={tagsInput} placeholder="fiction, sci-fi, favorite" />
      </label>
    </div>

    <div class="detail_actions" class:detail_actions_four={canNativeShare}>
      {#if canNativeShare}
        <button class="btn btn_secondary" onclick={shareBook} disabled={sharingBook}>
          <span class="detail_action_button_inner">
            {#if !sharingBook}
              <span class="detail_action_icon_wrap">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                  <circle cx="18" cy="5.5" r="2" stroke-width="2" />
                  <circle cx="6" cy="12" r="2" stroke-width="2" />
                  <circle cx="18" cy="18.5" r="2" stroke-width="2" />
                  <path d="M8 11l8-4" stroke-width="2" />
                  <path d="M8 13l8 4" stroke-width="2" />
                </svg>
              </span>
            {/if}
            <span class="detail_action_label">
              {#if sharingBook}
                <span>LET'S</span>
                <span>DO</span>
                <span>IT</span>
              {:else}
                <span>Share</span>
                <span>Book</span>
              {/if}
            </span>
          </span>
        </button>
      {/if}
      <button
        class="btn btn_secondary"
        class:detail_action_copy_success={copiedBookText}
        onclick={copyBookText}
        disabled={copyingBookText}
      >
        <span class="detail_action_button_inner">
          {#if !copyingBookText && !copiedBookText}
            <span class="detail_action_icon_wrap">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                <rect x="9" y="9" width="11" height="11" rx="2" stroke-width="2" />
                <path d="M6 15H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v1" stroke-width="2" />
              </svg>
            </span>
          {/if}
          <span class="detail_action_label">
            {#if copyingBookText}
              <span>Copying...</span>
            {:else if copiedBookText}
              <span>COPIED</span>
              <span>TO YOUR</span>
              <span>CLIPBOARD</span>
            {:else}
              <span>Copy</span>
              <span>Book</span>
              <span>Info</span>
            {/if}
          </span>
        </span>
      </button>
      <button class="btn btn_danger" onclick={remove}>Remove</button>
      <button class="btn btn_primary" onclick={save} disabled={saving || !hasChanges}>
        {saving ? 'Saving...' : 'Save'}
      </button>
    </div>

    {#if removeConfirmOpen}
      <details class="rband_confirm rband_confirm_inline" open aria-label="Remove book confirmation">
        <summary class="rband_confirm_summary">Remove Book</summary>
        <div class="rband_confirm_copy">
          <p>Remove "{book.title}" from your library? This cannot be undone.</p>
        </div>
        <div class="rband_confirm_actions">
          <button class="btn btn_ghost" onclick={cancelRemove}>Cancel</button>
          <button class="btn btn_danger" onclick={confirmRemove}>Delete</button>
        </div>
      </details>
    {/if}
  </div>
</details>
