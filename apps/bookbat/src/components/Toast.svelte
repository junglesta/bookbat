<script lang="ts">
  import { getToastMessage, isToastVisible } from '../lib/stores.svelte.ts';
</script>

{#if isToastVisible()}
  <div class="toast" role="alert">
    {getToastMessage()}
  </div>
{/if}
