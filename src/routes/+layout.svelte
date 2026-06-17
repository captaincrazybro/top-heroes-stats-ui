<script>
  import '../app.css';
  import { page } from '$app/stores';

  let { children } = $props();
  let sidebarOpen = $state(false);

  function close() { sidebarOpen = false; }

  $effect(() => { $page.url; sidebarOpen = false; });
</script>

<svelte:head>
  <title>Top Heroes Stats</title>
</svelte:head>

<div class="app-layout">
  <button class="sidebar-toggle" aria-label="Toggle navigation" onclick={() => sidebarOpen = !sidebarOpen}>☰</button>

  <div class="sidebar-overlay" class:open={sidebarOpen} onclick={close}></div>

  <nav class="sidebar" class:open={sidebarOpen}>
    <div class="sidebar-title">Top Heroes Stats</div>
    <a href="/" class="sidebar-link" class:active={$page.url.pathname === '/'} onclick={close}>
      📊 Leaderboard
    </a>
    <a href="/roster" class="sidebar-link" class:active={$page.url.pathname === '/roster'} onclick={close}>
      🛡 Guild Roster
    </a>
  </nav>

  <main class="main-content">
    {@render children()}
  </main>
</div>
