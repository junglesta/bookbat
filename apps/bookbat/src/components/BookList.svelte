<script lang="ts">
  import type { Book } from '../lib/types';
  import BookCard from './BookCard.svelte';
  import BookDetail from './BookDetail.svelte';

  interface Props {
    books: Book[];
    onSelect: (book: Book) => void;
    selectedBook: Book | null;
    onCloseDetail: () => void;
    compact?: boolean;
  }

  let { books, onSelect, selectedBook, onCloseDetail, compact = false }: Props = $props();

  let rowRefs = $state<Record<string, HTMLDivElement | undefined>>({});

  function handleSelect(book: Book) {
    onSelect(book);
    requestAnimationFrame(() => {
      const row = rowRefs[book.id];
      if (row && typeof row.scrollIntoView === "function") {
        row.scrollIntoView({
        block: "nearest",
        behavior: "smooth",
        });
      }
    });
  }
</script>

{#if books.length === 0}
  <div class="empty_state">
    <svg class="empty_icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      <line x1="9" y1="7" x2="15" y2="7" />
      <line x1="9" y1="11" x2="13" y2="11" />
    </svg>
    <p>No books yet. Scan an ISBN to get started!</p>
  </div>
{:else}
  <div class="book_list" class:compact>
    {#each books as book (book.id)}
      <div class="book_list_item" bind:this={rowRefs[book.id]}>
        {#if selectedBook?.id === book.id}
          <BookDetail book={selectedBook} onClose={onCloseDetail} />
        {:else}
          <BookCard {book} {compact} onclick={() => handleSelect(book)} />
        {/if}
      </div>
    {/each}
  </div>
{/if}
