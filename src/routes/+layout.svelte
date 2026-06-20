<script>
  import '../app.css';
  import { page } from '$app/stores';

  let { children } = $props();
  let sidebarOpen = $state(false);

  function close() { sidebarOpen = false; }

  $effect(() => { $page.url; sidebarOpen = false; });
</script>

<svelte:head>
  <title>HGS Guild Hub</title>
</svelte:head>

<div class="app-layout">
  <button class="sidebar-toggle" aria-label="Toggle navigation"
    style:display={sidebarOpen ? 'none' : null}
    onclick={() => sidebarOpen = !sidebarOpen}>☰</button>

  <div class="sidebar-overlay" class:open={sidebarOpen} onclick={close}></div>

  <nav class="sidebar" class:open={sidebarOpen}>
    <div class="sidebar-title">HGS Guild Hub</div>
    <a href="/" class="sidebar-link" class:active={$page.url.pathname === '/'} onclick={close}>
      🛡 Guild Roster
    </a>
    <a href="/event-results" class="sidebar-link" class:active={$page.url.pathname === '/event-results'} onclick={close}>
      🏆 Event Results
    </a>
    <a href="/guild-rankings" class="sidebar-link" class:active={$page.url.pathname === '/guild-rankings'} onclick={close}>
      📊 Guild Rankings
    </a>
    <a href="/past-members" class="sidebar-link" class:active={$page.url.pathname === '/past-members'} onclick={close}>
      👤 Past Members
    </a>
    <a href="https://docs.google.com/forms/d/e/1FAIpQLScxhE05Z5XxCwatVZDtTejMmNdfejLloPrXQ76M8NwwxJ6ugQ/viewform?usp=sharing&ouid=108080413243526511864" class="sidebar-link" target="_blank" rel="noopener noreferrer" onclick={close}>
      📝 New Members Form
    </a>
  </nav>

  <main class="main-content">
    {@render children()}
  </main>
</div>
