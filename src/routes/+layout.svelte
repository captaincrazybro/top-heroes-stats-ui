<script>
  import '../app.css';
  let { children } = $props();
</script>

<svelte:head>
  <title>Top Heroes Stats</title>
</svelte:head>

{@render children()}
