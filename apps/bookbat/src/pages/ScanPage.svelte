<script lang="ts">
    import Scanner from "../components/Scanner.svelte";
    import BookCard from "../components/BookCard.svelte";
    import {
        scanIsbn,
        addBookToCollection,
        showToast,
        navigate,
    } from "../lib/stores.svelte";
    import { getErrorMessage } from "../lib/error";
    import type { ScanResult } from "../lib/types";

    let preview = $state<ScanResult | null>(null);
    let scanning = $state(false);
    let lastScannedIsbn = $state("");
    let justAdded = $state(false);
    let lookupError = $state("");
    let scannerResetKey = $state(0);
    let isbnInfoOpen = $state(false);

    async function handleScan(isbn: string) {
        if (isbn === lastScannedIsbn && preview) return;
        lastScannedIsbn = isbn;
        scanning = true;
        justAdded = false;
        lookupError = "";

        try {
            const result = await scanIsbn(isbn);
            preview = result;
            if (result.alreadyExists) {
                showToast("This book is already in your library.");
            }
        } catch (e: unknown) {
            lookupError = getErrorMessage(e, "Book not found");
            preview = null;
        } finally {
            scanning = false;
        }
    }

    async function addToLibrary() {
        if (!preview || preview.alreadyExists) return;

        try {
            await addBookToCollection(preview.book);
            justAdded = true;
        } catch {
            // Toast shown by store
        }
    }

    function viewInLibrary() {
        navigate("#/library");
    }

    function scanAnother() {
        preview = null;
        lastScannedIsbn = "";
        justAdded = false;
        lookupError = "";
        scanning = false;
        scannerResetKey += 1;
    }
</script>

<div class="scan_page" class:scan_page_relaxed={!preview && !lookupError && !scanning}>
    <div class="scan_header">
        <h2 class="export_heading">Scan ISBN</h2>
        <button class="help_btn" aria-label="What is ISBN?" onclick={() => (isbnInfoOpen = !isbnInfoOpen)}>
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

    {#if isbnInfoOpen}
        <details class="scan_info_accordion" open>
            <summary>What is an ISBN?</summary>
            <p>
                ISBN means International Standard Book Number. It is a unique identifier for a specific
                book edition, used by publishers, bookstores, and libraries to find, catalog, and track
                books accurately.
            </p>
        </details>
    {/if}

    <div class="scan_entry_zone">
        {#key scannerResetKey}
            <Scanner onScan={handleScan} />
        {/key}
    </div>

    {#if scanning}
        <div class="scan_loading">
            <div class="spinner"></div>
            <p>Looking up ISBN...</p>
        </div>
    {/if}

    {#if lookupError}
        <div class="scan_preview scan_error_panel">
            <details class="rband_note rband_note_error" open>
                <summary class="rband_note_summary">Lookup Error</summary>
                <p>{lookupError}</p>
            </details>
            <button class="btn btn_primary" style="width:100%" onclick={scanAnother}>Try Again</button>
        </div>
    {/if}

    {#if preview}
        <div class="scan_preview" class:added={justAdded}>
            {#if justAdded}
                <div class="added_badge">Added to library</div>
            {/if}

            <BookCard book={preview.book} compact />

            <div class="preview_actions">
                {#if justAdded}
                    <button class="btn btn_primary" onclick={viewInLibrary}
                        >View in Library</button
                    >
                    <button class="btn btn_secondary" onclick={scanAnother}
                        >Scan Another</button
                    >
                {:else if preview.alreadyExists}
                    <button class="btn btn_secondary" onclick={viewInLibrary}
                        >View in Library</button
                    >
                    <button class="btn btn_ghost" onclick={scanAnother}
                        >Dismiss</button
                    >
                {:else}
                    <button class="btn btn_primary" onclick={addToLibrary}
                        >Add to Library</button
                    >
                    <button class="btn btn_ghost" onclick={scanAnother}
                        >Dismiss</button
                    >
                {/if}
            </div>
        </div>
    {/if}
</div>
