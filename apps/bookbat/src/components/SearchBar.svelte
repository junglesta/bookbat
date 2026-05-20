<script lang="ts">
  interface Props {
    value: string;
    onInput: (value: string) => void;
    placeholder?: string;
  }

  let { value, onInput, placeholder = 'Search by title or author...' }: Props = $props();
</script>

<div class="search_bar">
  <input
    type="search"
    {value}
    {placeholder}
    oninput={(e) => onInput(e.currentTarget.value)}
  />
</div>
