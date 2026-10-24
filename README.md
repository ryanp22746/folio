# Folio

A local, browser-based personal media library prototype for movies, TV, anime, games, music, visual novels, and books.

## Run locally

Install Node.js, then run from this folder:

```sh
npm start
```

Open http://127.0.0.1:5174. Keep the server running while using Folio. No npm dependencies or build step are required. On Windows, you can also double-click `Start-Folio.cmd`.

## Features

- Home with library statistics, dated memories, and explainable recommendations.
- Search a sample catalog in grid or list view; add titles with optional collections or immediate property editing.
- Library filters, favorites, ratings, custom media types, and bulk actions.
- Collections with customizable covers.
- Media details, editable artwork, progress units, dated consumption sessions, and formatted notes.
- Forest, Charcoal Dark, and Yotsuba-inspired light themes.
- Browser-local preferences and JSON library export.

## Architecture and storage

`dist/index.html`, `dist/style.css`, and `dist/app.js` implement the frontend. `server.cjs` serves static files on localhost only.

Library data lives in browser localStorage, not in this repository or a server database. Use the same browser and URL to retain access to saved data. Clearing browser storage can erase the library. Export backups before clearing it. Import, accounts, and device synchronization are not implemented.

The catalog, descriptions, and external ratings are illustrative sample data. There are no live metadata API connections. Provider links open external services; recommendations use local sample metadata and personal preferences.

## Validate

```sh
npm run check
```

This checks JavaScript syntax. It is not a complete automated UI test suite.

## Assets

See `ASSET-NOTES.txt` for rating-icon attribution. Abstract cover artwork is included in the frontend. Local hosting metadata, personal environment files, and generated preview screenshots are excluded from Git.

## Live metadata (integration branch)
Copy `.env.example` to `.env`. Set `METADATA_API_BASE_URL` to the running API (locally http://127.0.0.1:8000) and `METADATA_API_KEY` to the same service secret configured there. Use Node 20.6+ and run `node --env-file=.env server.cjs`, then open http://127.0.0.1:5174/#search. The Live metadata panel searches providers and adds selected entries to this browser's library. API/provider credentials must never be put in dist/ files.

Run `node test-proxy.cjs` and `node test-identity.cjs` for integration unit checks. This remains a local single-user prototype, bound to loopback. Before public hosting, add user authentication, per-user storage and proxy rate limits. Browser localStorage is not a shared database; duplicate prevention is currently per browser/library, and concurrent-tab imports are not transactional. Existing imported/manual entries lacking provider IDs can only receive title-match warnings. Export your library before testing imports.
