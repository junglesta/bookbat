<script lang="ts">
  import { onDestroy } from 'svelte';
  import { cleanIsbn, isValidIsbn10, isValidIsbn13 } from '../lib/isbn';
  import { getErrorMessage } from '../lib/error';

  interface Props {
    onScan: (isbn: string) => void;
  }

  let { onScan }: Props = $props();

  let scannerRef: HTMLDivElement | undefined = $state();
  type ActiveScanner = {
    stop: () => Promise<void>;
    clear: () => void;
  };

  let scanner: ActiveScanner | null = null;
  let scannerError = $state('');
  let isScanning = $state(false);
  let scannerViewKey = $state(0);
  let scannerBoxStyle = $state('');

  let isbn13 = $state('');
  let isbn10 = $state('');
  let inputError = $state('');
  let manualInfoOpen = $state(false);

  // ISBN-13 dash positions: 978-3-161484-10-0 → after digit 3, 4, 10, 12
  const ISBN13_DASHES = [3, 4, 10, 12];
  // ISBN-10 dash positions: 0-306406-15-2 → after digit 1, 7, 9
  const ISBN10_DASHES = [1, 7, 9];

  function autoFormat(digits: string, dashPositions: number[]): string {
    let result = '';
    let di = 0;
    for (let i = 0; i < digits.length; i++) {
      result += digits[i];
      di++;
      if (dashPositions.includes(di) && i < digits.length - 1) {
        result += '-';
      }
    }
    return result;
  }

  function handleIsbn13Input(e: Event) {
    const input = e.currentTarget as HTMLInputElement;
    const cursorBefore = input.selectionStart ?? 0;
    const oldVal = isbn13;

    // Strip to digits only
    const digits = input.value.replace(/[^\d]/g, '').slice(0, 13);
    const formatted = autoFormat(digits, ISBN13_DASHES);
    isbn13 = formatted;

    // Fix cursor position after formatting
    requestAnimationFrame(() => {
      const digitsBeforeCursor = oldVal.slice(0, cursorBefore).replace(/[^\d]/g, '').length;
      let newPos = 0;
      let counted = 0;
      for (let i = 0; i < formatted.length; i++) {
        if (formatted[i] !== '-') counted++;
        if (counted >= digitsBeforeCursor + 1) { newPos = i + 1; break; }
      }
      if (counted < digitsBeforeCursor + 1) newPos = formatted.length;
      input.setSelectionRange(newPos, newPos);
    });

    inputError = '';
  }

  function handleIsbn10Input(e: Event) {
    const input = e.currentTarget as HTMLInputElement;
    const cursorBefore = input.selectionStart ?? 0;
    const oldVal = isbn10;

    // Strip to digits + X only (X only allowed at end)
    let raw = input.value.replace(/[^\dXx]/g, '');
    // Ensure X only at position 10
    const xPos = raw.search(/[Xx]/);
    if (xPos !== -1 && xPos < 9) {
      raw = raw.replace(/[Xx]/g, '');
    }
    const digits = raw.slice(0, 10);
    const formatted = autoFormat(digits, ISBN10_DASHES);
    isbn10 = formatted;

    requestAnimationFrame(() => {
      const digitsBeforeCursor = oldVal.slice(0, cursorBefore).replace(/[^\dXx]/g, '').length;
      let newPos = 0;
      let counted = 0;
      for (let i = 0; i < formatted.length; i++) {
        if (formatted[i] !== '-') counted++;
        if (counted >= digitsBeforeCursor + 1) { newPos = i + 1; break; }
      }
      if (counted < digitsBeforeCursor + 1) newPos = formatted.length;
      input.setSelectionRange(newPos, newPos);
    });

    inputError = '';
  }

  onDestroy(() => {
    stopScanner();
  });

  function killVideoTracks() {
    if (!scannerRef) return;
    const video = scannerRef.querySelector('video');
    if (video?.srcObject) {
      (video.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      video.srcObject = null;
    }
    scannerRef.querySelectorAll('video, canvas').forEach(el => el.remove());
  }

  function computeScannerBox(viewfinderWidth: number, viewfinderHeight: number) {
    const width = Math.max(160, Math.min(Math.floor(viewfinderWidth * 0.88), 340));
    const height = Math.max(90, Math.min(Math.floor(viewfinderHeight * 0.54), 180));
    scannerBoxStyle = `--scanner_box_width: ${width}px; --scanner_box_height: ${height}px;`;
    return { width, height };
  }

  function isFirefoxBrowser(): boolean {
    if (typeof navigator === 'undefined') return false;
    const userAgent = navigator.userAgent.toLowerCase();
    return userAgent.includes('firefox') || userAgent.includes('fxios');
  }

  async function startScanner() {
    if (!scannerRef || isScanning) return;
    scannerError = '';
    isScanning = true;

    try {
      const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import('html5-qrcode');
      scanner = new Html5Qrcode(scannerRef.id, {
        // Firefox can report BarcodeDetector support while decoding remains unreliable.
        useBarCodeDetectorIfSupported: !isFirefoxBrowser(),
      });

      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: (viewfinderWidth: number, viewfinderHeight: number) =>
            computeScannerBox(viewfinderWidth, viewfinderHeight),
          formatsToSupport: [
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.UPC_A,
          ],
        },
        (decodedText: string) => {
          const cleaned = decodedText.replace(/[^0-9]/g, '');
          if (cleaned.length === 13 || cleaned.length === 10) {
            // Defer stop to avoid re-entrancy inside library callback
            setTimeout(() => stopScanner(), 0);
            onScan(cleaned);
          }
        },
        () => {}
      );
    } catch (err: unknown) {
      scannerError = getErrorMessage(err, 'Failed to start camera');
      killVideoTracks();
      isScanning = false;
    }
  }

  function stopScanner() {
    const s = scanner;
    scanner = null;
    if (s) {
      try { s.stop().catch(() => {}); } catch {}
      try { s.clear(); } catch {}
    }
    killVideoTracks();
    isScanning = false;
    scannerBoxStyle = '';
    // Force a clean scanner viewport so the idle CTA always returns.
    scannerViewKey += 1;
  }

  function submitIsbn13(e: Event) {
    e.preventDefault();
    inputError = '';
    const cleaned = cleanIsbn(isbn13);
    if (!isValidIsbn13(cleaned)) {
      inputError = 'Invalid ISBN-13 checksum';
      return;
    }
    onScan(cleaned);
    isbn13 = '';
  }

  function submitIsbn10(e: Event) {
    e.preventDefault();
    inputError = '';
    const cleaned = cleanIsbn(isbn10);
    if (!isValidIsbn10(cleaned)) {
      inputError = 'Invalid ISBN-10 checksum';
      return;
    }
    onScan(cleaned);
    isbn10 = '';
  }
</script>

<div class="scanner_container">
  {#key scannerViewKey}
    <div
      id="scanner-view"
      bind:this={scannerRef}
      style={isScanning ? scannerBoxStyle : ''}
      class={isScanning ? 'scanner_view scanner_view_scanning' : 'scanner_view_idle'}
    >
      {#if !isScanning}
        <button class="btn btn_primary scanner_start_btn" onclick={startScanner}>
          Open Camera Scanner
        </button>
      {/if}
    </div>
  {/key}
  {#if isScanning}
    <button class="btn btn_primary" onclick={stopScanner}>Stop Camera</button>
  {/if}
  {#if !isScanning && scannerError}
    <details class="rband_note rband_note_error" open>
      <summary class="rband_note_summary">Camera Error</summary>
      <p>{scannerError}</p>
    </details>
  {/if}

  <div class="manual_section">
    <div class="scan_header manual_header">
      <h3 class="export_heading">Or enter ISBN manually</h3>
      <button
        class="help_btn"
        aria-label="ISBN format help"
        onclick={() => (manualInfoOpen = !manualInfoOpen)}
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

    {#if manualInfoOpen}
      <details class="scan_info_accordion manual_info_accordion" open>
        <summary>What is an ISBN?</summary>
        <p>
          ISBN means International Standard Book Number. It is a unique identifier for a specific
          book edition, used by publishers, bookstores, and libraries to find, catalog, and track
          books accurately.
        </p>
      </details>
    {/if}

    <form class="manual_input" onsubmit={submitIsbn13}>
      <input
        type="text"
        value={isbn13}
        oninput={handleIsbn13Input}
        placeholder="978-3-161484-10-0"
        inputmode="numeric"
        maxlength="17"
      />
      <button type="submit" class="btn btn_primary" disabled={!isbn13.trim()}>ISBN-13</button>
    </form>

    <form class="manual_input" onsubmit={submitIsbn10}>
      <input
        type="text"
        value={isbn10}
        oninput={handleIsbn10Input}
        placeholder="0-306406-15-2"
        inputmode="numeric"
        maxlength="13"
      />
      <button type="submit" class="btn btn_primary" disabled={!isbn10.trim()}>ISBN-10</button>
    </form>

    {#if inputError}
      <details class="rband_note rband_note_error" open>
        <summary class="rband_note_summary">Invalid ISBN</summary>
        <p>{inputError}</p>
      </details>
    {/if}
  </div>
</div>
