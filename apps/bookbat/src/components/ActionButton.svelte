<script lang="ts">
  type ActionIcon = 'copy' | 'help' | 'share';
  type ButtonType = 'button' | 'reset' | 'submit';

  interface Props {
    icon: ActionIcon;
    labelLines: string[];
    buttonClass?: string;
    type?: ButtonType;
    disabled?: boolean;
    hideIcon?: boolean;
    compact?: boolean;
    ariaLabel?: string;
    onclick?: (event: MouseEvent) => void;
  }

  let {
    icon,
    labelLines,
    buttonClass = '',
    type = 'button',
    disabled = false,
    hideIcon = false,
    compact = false,
    ariaLabel,
    onclick,
  }: Props = $props();
</script>

<button
  {type}
  class={`action_button ${compact ? 'action_button_compact' : ''} ${buttonClass}`.trim()}
  {disabled}
  aria-label={ariaLabel ?? labelLines.join(' ')}
  {onclick}
>
  <span class="action_button_inner" class:action_button_inner_no_icon={hideIcon}>
    {#if !hideIcon}
      <span class="action_button_icon_wrap" aria-hidden="true">
        {#if icon === 'share'}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="18" cy="5.5" r="2" stroke-width="2" />
            <circle cx="6" cy="12" r="2" stroke-width="2" />
            <circle cx="18" cy="18.5" r="2" stroke-width="2" />
            <path d="M8 11l8-4" stroke-width="2" />
            <path d="M8 13l8 4" stroke-width="2" />
          </svg>
        {:else if icon === 'copy'}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <rect x="9" y="9" width="11" height="11" rx="2" stroke-width="2" />
            <path d="M6 15H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v1" stroke-width="2" />
          </svg>
        {:else}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="12" cy="12" r="9" stroke-width="2" />
            <path d="M9.8 9a2.2 2.2 0 1 1 3.8 1.5c-.8.7-1.5 1.2-1.5 2.3" stroke-width="2" />
            <circle cx="12" cy="17.3" r="1" fill="currentColor" stroke="none" />
          </svg>
        {/if}
      </span>
    {/if}

    <span class="action_button_label">
      {#each labelLines as line}
        <span>{line}</span>
      {/each}
    </span>
  </span>
</button>

<style>
  .action_button_inner {
    width: 100%;
    display: grid;
    grid-template-columns: 44px minmax(0, 1fr);
    align-items: center;
    gap: 6px;
  }

  .action_button_inner_no_icon {
    grid-template-columns: minmax(0, 1fr);
  }

  .action_button_compact .action_button_inner {
    grid-template-columns: 34px minmax(0, 1fr);
    gap: 8px;
  }

  .action_button_icon_wrap {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .action_button svg {
    width: 18px;
    height: 18px;
    flex-shrink: 0;
    color: currentColor;
    stroke-width: 1.8;
  }

  .action_button_compact svg {
    width: 17px;
    height: 17px;
  }

  .action_button_label {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: center;
    text-align: left;
    line-height: 1.05;
  }

  .action_button_label span {
    display: block;
  }

  @media (min-width: 640px) {
    .action_button_label {
      flex-direction: row;
      flex-wrap: wrap;
      gap: 0 0.35em;
    }

    .action_button_label span {
      display: inline;
    }
  }
</style>
