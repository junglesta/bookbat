<script lang="ts">
import { onMount } from 'svelte';
import BookList from '../components/BookList.svelte';
import SearchBar from '../components/SearchBar.svelte';
  import { getErrorMessage } from "../lib/error";
  import {
    getSupportedImportExtensionsLabel,
    isSupportedImportFileName,
    parseImportedBooks,
  } from "../lib/import";
  import {
    clearLibraryCollection,
    getBooks,
    getLibraryName,
    importBooksToCollection,
    isLoading,
    loadBooks,
    setLibraryName,
    showToast,
  } from "../lib/stores.svelte.ts";
  import type { Book } from '../lib/types';

  onMount(() => { loadBooks(); });

  let selectedBook = $state<Book | null>(null);
  let searchQuery = $state('');
  let statusFilter = $state<string>('all');
  let sortBy = $state<'dateAdded' | 'title' | 'author' | 'publisher' | 'rating'>('dateAdded');
  let sortDirection = $state<'asc' | 'desc'>('desc');
  let sortMenuOpen = $state(false);
  let viewMode = $state<'card' | 'list'>('card');
  let languageFilter = $state<string>('all');
  let languageMenuOpen = $state(false);
  let importInputRef = $state<HTMLInputElement>();
  let dropConfirmOpen = $state(false);
  let importFeedbackError = $state("");
  let libraryNameInfoOpen = $state(false);

  const statusOptions = [
    { value: 'all', label: 'All' },
    { value: 'to-read', label: 'To Read' },
    { value: 'reading', label: 'Reading' },
    { value: 'read', label: 'Read' },
  ];

  const sortOptions = [
    { value: 'dateAdded' as const, label: 'Recent' },
    { value: 'title' as const, label: 'Title' },
    { value: 'author' as const, label: 'Author' },
    { value: 'publisher' as const, label: 'Publisher' },
    { value: 'rating' as const, label: 'Rating' },
  ];

  function uniqueLanguages(): string[] {
    const langs = new Set<string>();
    for (const b of getBooks()) {
      langs.add(b.language || '');
    }
    return [...langs].sort((a, b) => {
      if (a === '') return 1;
      if (b === '') return -1;
      return a.localeCompare(b);
    });
  }

  function pickSort(value: typeof sortBy) {
    sortBy = value;
    sortMenuOpen = false;
  }

  function pickLanguage(value: string) {
    languageFilter = value;
    languageMenuOpen = false;
  }

  function toggleSortMenu() {
    sortMenuOpen = !sortMenuOpen;
  }

  function toggleSortDirection() {
    sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
  }

  function toggleLanguageMenu() {
    languageMenuOpen = !languageMenuOpen;
  }

  function closeMenus(e: MouseEvent) {
    const target = e.target as HTMLElement;
    if (!target.closest('.sort_menu_wrap')) {
      sortMenuOpen = false;
    }
    if (!target.closest('.lang_menu_wrap')) {
      languageMenuOpen = false;
    }
  }

  function filteredBooks(): Book[] {
    let result = getBooks();

    if (statusFilter !== 'all') {
      result = result.filter((b) => b.status === statusFilter);
    }

    if (languageFilter !== 'all') {
      result = result.filter((b) => (b.language || '') === languageFilter);
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          b.authors.some((a) => a.toLowerCase().includes(q))
      );
    }

    const direction = sortDirection === 'asc' ? 1 : -1;
    result = [...result].sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title) * direction;
        case 'author':
          return (a.authors[0] || '').localeCompare(b.authors[0] || '') * direction;
        case 'publisher':
          return (a.publisher || '').localeCompare(b.publisher || '') * direction;
        case 'rating':
          return ((a.rating || 0) - (b.rating || 0)) * direction;
        case 'dateAdded':
        default:
          return (new Date(a.dateAdded).getTime() - new Date(b.dateAdded).getTime()) * direction;
      }
    });

    return result;
  }

  function statusCount(value: string): number {
    if (value === 'all') return getBooks().length;
    return getBooks().filter((b) => b.status === value).length;
  }

  function openImportPicker() {
    importFeedbackError = "";
    importInputRef?.click();
  }

  function dropLibrary() {
    if (getBooks().length === 0) {
      showToast("Library is already empty.");
      return;
    }
    dropConfirmOpen = !dropConfirmOpen;
  }

  function cancelDropLibrary() {
    dropConfirmOpen = false;
  }

  function confirmDropLibrary() {
    clearLibraryCollection();
    selectedBook = null;
    dropConfirmOpen = false;
  }

  async function handleImportChange(e: Event) {
    const input = e.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    try {
      if (!isSupportedImportFileName(file.name)) {
        importFeedbackError = `Unsupported file type (${file.name}). Use ${getSupportedImportExtensionsLabel()}.`;
        return;
      }

      const content = await file.text();
      const importedBooks = parseImportedBooks(content, file.name);
      importFeedbackError = "";
      const summary = importBooksToCollection(importedBooks);
      if (summary.total === 0) {
        showToast("No valid books found in file.");
      } else if (summary.added === 0) {
        showToast("No new books imported (duplicates or invalid rows).");
      } else {
        showToast(
          `Imported ${summary.added} book${summary.added === 1 ? "" : "s"} (${summary.skipped} skipped${summary.failed > 0 ? `, ${summary.failed} failed` : ""}).`,
        );
      }
    } catch (error: unknown) {
      importFeedbackError = getErrorMessage(error, "Import failed");
    } finally {
      input.value = "";
    }
  }
</script>

<svelte:window onclick={closeMenus} />

<div class="library_page">
  <div class="library_header">
    <div class="library_header_left">
      <input
        class="library_name_input"
        type="text"
        value={getLibraryName()}
        oninput={(e) => setLibraryName(e.currentTarget.value)}
      />
      <button
        class="help_btn library_name_info_btn"
        aria-label="Library name info"
        onclick={() => (libraryNameInfoOpen = !libraryNameInfoOpen)}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="11" x2="12" y2="16" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
      </button>
    </div>
    <div class="library_header_actions">
      <button class="view_toggle view_toggle_text" onclick={dropLibrary} aria-label="Drop library">
        Drop
      </button>
      <button class="view_toggle view_toggle_text" onclick={openImportPicker} aria-label="Import books">
        Import
      </button>
      <input
        bind:this={importInputRef}
        type="file"
        accept=".json,.csv,.css"
        style="display:none"
        onchange={handleImportChange}
      />
      <button class="view_toggle view_toggle_icon" onclick={() => viewMode = viewMode === 'card' ? 'list' : 'card'} aria-label="Toggle view">
        {#if viewMode === 'card'}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <rect x="4" y="5" width="16" height="5" rx="1.2" />
            <rect x="4" y="14" width="16" height="5" rx="1.2" />
          </svg>
        {:else}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
          </svg>
        {/if}
      </button>

      <div class="sort_menu_wrap">
        <div class="sort_menu_controls">
          <button
            class="sort_direction_trigger"
            onclick={toggleSortDirection}
            aria-label="Reverse sort order"
            title="Reverse sort order"
          >
            {sortDirection === 'asc' ? '↑' : '↓'}
          </button>
          <button class="sort_trigger" onclick={toggleSortMenu} aria-label="Sort options">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="24" height="24">
              <path d="M7 4v14" />
              <path d="m4 15 3 3 3-3" />
              <path d="M17 20V6" />
              <path d="m14 9 3-3 3 3" />
            </svg>
          </button>
        </div>

        {#if sortMenuOpen}
          <div class="sort_dropdown">
            {#each sortOptions as opt}
              <button
                class="sort_option"
                class:active={sortBy === opt.value}
                onclick={() => pickSort(opt.value)}
              >{opt.label}</button>
            {/each}
          </div>
        {/if}
      </div>
    </div>
  </div>

  {#if libraryNameInfoOpen}
    <details class="rband_note" open>
      <summary class="rband_note_summary">Library Name</summary>
      <p>
        You can edit this library name anytime. It is used in the app and carried into export file
        names.
      </p>
    </details>
  {/if}

  {#if dropConfirmOpen}
    <details class="rband_confirm rband_confirm_inline" open aria-label="Drop library confirmation">
      <summary class="rband_confirm_summary">Drop Library</summary>
      <div class="rband_confirm_copy">
        <p>Delete all books from this library? This cannot be undone.</p>
      </div>
      <div class="rband_confirm_actions">
        <button class="btn btn_ghost" onclick={cancelDropLibrary}>Cancel</button>
        <button class="btn btn_danger" onclick={confirmDropLibrary}>Delete</button>
      </div>
    </details>
  {/if}

  {#if importFeedbackError}
    <details class="rband_note rband_note_error" open>
      <summary class="rband_note_summary">Import Error</summary>
      <p>{importFeedbackError}</p>
    </details>
  {/if}

  <SearchBar value={searchQuery} onInput={(v) => (searchQuery = v)} />

  <div class="library_controls">
    <div class="status_tabs">
      {#each statusOptions as opt}
        <button
          class="tab"
          class:active={statusFilter === opt.value}
          onclick={() => (statusFilter = opt.value)}
        >{`${opt.label} ${statusCount(opt.value)}`}</button>
      {/each}
    </div>

    {#if uniqueLanguages().length > 0}
      <div class="lang_menu_wrap">
        <button class="lang_trigger" onclick={toggleLanguageMenu} aria-label="Filter by language">
          {languageFilter === 'all' ? 'Lang' : languageFilter === '' ? '??' : languageFilter.toUpperCase()} ▾
        </button>

        {#if languageMenuOpen}
          <div class="lang_dropdown">
            <button
              class="lang_option"
              class:active={languageFilter === 'all'}
              onclick={() => pickLanguage('all')}
            >All</button>
            {#each uniqueLanguages() as lang}
              <button
                class="lang_option"
                class:active={languageFilter === lang}
                onclick={() => pickLanguage(lang)}
              >{lang === '' ? '??' : lang.toUpperCase()}</button>
            {/each}
          </div>
        {/if}
      </div>
    {/if}
  </div>

  {#if isLoading()}
    <div class="loading">
      <div class="spinner"></div>
    </div>
  {:else}
    <BookList
      books={filteredBooks()}
      selectedBook={selectedBook}
      onSelect={(b) => (selectedBook = b)}
      onCloseDetail={() => (selectedBook = null)}
      compact={viewMode === 'list'}
    />
  {/if}
</div>
