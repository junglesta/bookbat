<script lang="ts">
  import { getRoute, navigate } from '../lib/stores.svelte.ts';

  const tabs = [
    { hash: '#/scan', label: 'Add' },
    { hash: '#/library', label: 'Library' },
    { hash: '#/export', label: 'Export' },
  ];
</script>

<nav class="bottom_nav">
  {#each tabs as tab}
    <button
      class="nav_tab"
      class:active={getRoute() === tab.hash}
      onclick={() => navigate(tab.hash)}
    >
      <svg class="nav_icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        {#if tab.hash === '#/scan'}
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        {:else if tab.hash === '#/library'}
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        {:else if tab.hash === '#/export'}
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        {/if}
      </svg>
      <span class="nav_label">{tab.label}</span>
    </button>
  {/each}
</nav>
