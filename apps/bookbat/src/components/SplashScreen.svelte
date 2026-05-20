<script lang="ts">
  import type { Snippet } from 'svelte';

  type Layout = 'scroll' | 'centered' | 'fill';

  interface Props {
    dismissible?: boolean;
    ariaLabel?: string;
    layout?: Layout;
    animated?: boolean;
    onclick?: (event: MouseEvent) => void;
    children?: Snippet;
  }

  let {
    dismissible = true,
    ariaLabel = 'Close splash screen',
    layout = 'scroll',
    animated = false,
    onclick,
    children,
  }: Props = $props();
</script>

{#if dismissible}
  <button
    type="button"
    class={`splash_shell splash_shell_dismissible ${animated ? 'splash_shell_animated' : ''}`.trim()}
    aria-label={ariaLabel}
    onclick={onclick}
  >
    <div class={`splash_shell_viewport splash_shell_viewport_${layout}`}>
      {@render children?.()}
    </div>
  </button>
{:else}
  <div class={`splash_shell ${animated ? 'splash_shell_animated' : ''}`.trim()}>
    <div class={`splash_shell_viewport splash_shell_viewport_${layout}`}>
      {@render children?.()}
    </div>
  </div>
{/if}

<style>
  .splash_shell {
    position: fixed;
    inset: 0;
    width: 100%;
    appearance: none;
    border: none;
    padding: 0;
    background: var(--bg);
    user-select: none;
    z-index: 999;
  }

  .splash_shell::before {
    content: '';
    position: absolute;
    inset: 0;
    z-index: -1;
    background: linear-gradient(180deg, #0a0a0a 0%, #0a0a0a 25%, #d4ff00 100%);
    filter: url(#dither);
  }

  .splash_shell_animated {
    animation: splash-shell-fade 0.4s ease 1s forwards;
  }

  .splash_shell_dismissible {
    animation: splash-shell-in 0.25s ease forwards;
    cursor: pointer;
  }

  .splash_shell_viewport {
    width: 100%;
    height: 100%;
    overflow-y: auto;
    overflow-x: hidden;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
    -ms-overflow-style: none;
  }

  .splash_shell_viewport::-webkit-scrollbar {
    display: none;
  }

  .splash_shell_viewport_scroll {
    display: block;
  }

  .splash_shell_viewport_centered {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px 16px;
  }

  .splash_shell_viewport_fill {
    overflow: hidden;
  }

  @keyframes splash-shell-in {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @keyframes splash-shell-fade {
    to {
      opacity: 0;
    }
  }
</style>
