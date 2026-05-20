<script lang="ts">
  import type { Book } from '../lib/types';
  import { setBookCoverUrl } from '../lib/stores.svelte';
  import { getCoverCandidates } from '../lib/cover';

  interface Props {
    book: Book;
    compact?: boolean;
    onclick?: () => void;
  }

  let { book, compact = false, onclick }: Props = $props();
  let coverCandidates = $state<string[]>([]);
  let coverIndex = $state(0);
  let coverLoaded = $state(false);

  const statusLabels: Record<string, string> = {
    'to-read': 'To Read',
    'reading': 'Reading',
    'read': 'Read',
  };
  const statusClassNames: Record<Book['status'], string> = {
    'to-read': 'status_to_read',
    'reading': 'status_reading',
    'read': 'status_read',
  };

  function stars(rating: number | undefined): string {
    if (!rating) return '';
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
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

  $effect(() => {
    coverCandidates = getCoverCandidates(book);
    coverIndex = 0;
    coverLoaded = false;
  });
</script>

<button class="book_card" class:compact onclick={onclick} type="button">
  {#if !compact}
    <div class="book_cover">
      {#if coverIndex >= 0 && coverCandidates[coverIndex]}
        {#if !coverLoaded}
          <div class="cover_placeholder">
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
          loading="lazy"
          referrerpolicy="no-referrer"
          onload={handleCoverLoaded}
          onerror={tryNextCover}
        />
      {:else}
        <div class="cover_placeholder">
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
  {/if}
  <div class="book_info">
    <h3 class="book_title">{book.title}</h3>
    <p class="book_authors">{book.authors.join(', ') || 'Unknown Author'}</p>
    {#if !compact}
      <div class="book_meta">
        <span class="book_status {statusClassNames[book.status]}">{statusLabels[book.status]}</span>
        {#if book.rating}
          <span class="book_rating">{stars(book.rating)}</span>
        {/if}
        {#if book.publishYear}
          <span class="book_year">{book.publishYear}</span>
        {/if}
      </div>
    {/if}
  </div>
</button>
