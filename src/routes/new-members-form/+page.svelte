<script>
  import { onMount } from 'svelte';

  const FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLScxhE05Z5XxCwatVZDtTejMmNdfejLloPrXQ76M8NwwxJ6ugQ/viewform?usp=sharing&ouid=108080413243526511864';

  onMount(() => {
    window.location.href = FORM_URL;
  });
</script>

<p class="msg">Redirecting to New Members Form…</p>

<style>
  .msg {
    padding: 2rem;
    color: #666;
    text-align: center;
  }
</style>
