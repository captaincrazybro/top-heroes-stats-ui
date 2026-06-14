# Top Heroes Stats UI

A SvelteKit leaderboard for viewing Top Heroes event scores, backed by PocketBase.

## Prerequisites

- Node.js 18+
- A running [PocketBase](https://pocketbase.io) instance with the `topHeroesEventRecords` collection

## Setup

1. Clone the repository and install dependencies:

   ```bash
   npm install
   ```

2. Copy the example environment file and set your PocketBase URL:

   ```bash
   cp .env.example .env
   ```

   Edit `.env`:

   ```
   PUBLIC_PB_URL=https://your-pocketbase-instance.example.com
   ```

## Development

Start the dev server:

```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

## Testing

Run the unit test suite:

```bash
npm test
```

## Building

Build for production (outputs static files via `adapter-static`):

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

## Environment Variables

| Variable | Description |
|---|---|
| `PUBLIC_PB_URL` | Base URL of the PocketBase instance (no trailing slash) |

## Project Structure

```
src/
  app.html              # HTML shell
  app.css               # Global styles
  lib/
    pb.js               # PocketBase API client
    utils.js            # Filtering and sorting helpers
    components/
      FilterBar.svelte  # Event / week / day dropdowns
      Leaderboard.svelte # Sortable score table
  routes/
    +page.svelte        # Main page — filter state and URL params
```

## License

MIT — see [LICENSE](LICENSE).
