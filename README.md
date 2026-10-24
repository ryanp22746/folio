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


Live discovery is now the main Search page. Default Best match orders normalized exact titles first, then prefix/substring/token matches, with rating counts and source popularity as tie-breakers. It ranks loaded pages only, not the entire upstream catalog. Media/source filters run upstream; year/genre/platform/library filters apply to loaded records. Full details can supply additional genres. Covers are optional; missing or flagged artwork uses a placeholder. Scores retain provider labels and scales. Run `node test-search.cjs`, `node test-identity.cjs` and `node test-proxy.cjs` for regression checks.

Search updates after a 600 ms typing pause (minimum two characters), aborts outdated browser requests and ignores stale responses. Dialogs dismiss on genuine backdrop clicks. Live imports open a draft dialog with optional collection selection, editable title/status/personal rating/genre/notes and an immediate default add path; nothing is saved until Add to library is confirmed. MangaUpdates rating_votes are retained for cross-provider relevance alongside IGDB/TMDB vote counts.


Search details now show attributed source score cards, review counts, title facts, genres, platforms and source links. Opening any dialog locks background scrolling and restores the prior position on close. Display scores use at most one decimal; the visible Search button is removed (Enter remains available).

Spacing suggestions query one compact alternate for two-to-four alphabetic words (for example, `casa blanca` → `casablanca`), then deduplicate provider IDs. Local relevance recognizes spacing, accents and small spelling differences among retrieved candidates; this is not a comprehensive spelling dictionary. Supplemental alternate results are limited to their first page.

Default Best match compares title relevance first, then calibrated provider vote-count signals, modest source popularity, query-specific music-catalog prominence and a small recency tie-breaker. It is a heuristic, not a global audience-size measurement. MusicBrainz's search score is not treated as popularity. Apple US album search provides key-free supplementary discovery and advisory prominence; title-and-artist agreement can boost MusicBrainz candidates for ranking only. No IDs or saved entries are merged from these hints. Apple is separately credited and its artwork is accompanied by a linked Apple Music badge.

MusicBrainz album art comes from Cover Art Archive release-group IDs; recordings use a linked release when available. Unavailable covers fall back to placeholders. MusicBrainz detail ratings use the original five-point scale; VNDB ratings and vote counts are now loaded too. IMDb/Rotten Tomatoes/Metacritic enrichment requires OMDB_API_KEY and an established IMDb ID; missing configuration appears in the details rather than inventing ratings.


Verified cross-provider album duplicates now share one discovery card when a MusicBrainz release links to the exact Apple album ID. Title/artist/date similarity alone never merges records. One leading MusicBrainz album candidate is resolved per query within four seconds, checking at most one official release; missing links, conflicting IDs, different kinds or lookup outages keep records separate. Grouped results preserve all source records, links, ratings and exact IDs when added to the library. Previously saved separate entries are not silently combined or overwritten.

Add dialogs include a favorite checkbox and a reduced-motion-aware heart animation. Owned search details and library popups expose Favorite and Remove from library; removal clears collection memberships and offers a ten-second Undo. Library cards show a subtle source label, and source links are available in a collapsed metadata disclosure. Covers use contained images in consistent frames so the full picture remains visible.


Album records with the same title, credited artist and full release date may also share a visual search card as selectable editions. This does not unify their IDs, ratings or library identity: a clean Apple edition and an explicit edition stay separate, and the details view explains the distinction. Verified source matches are still combined only by shared IDs, and all source records remain available. Existing saved duplicate entries are preserved for manual review rather than silently deleting personal data.


Theme styling is centralized in `dist/themes.css`: palette definitions own literal colors and components use shared semantic surface/text/border/accent/favorite tokens. Forest, Dark and Yotsuba cover discovery, source panels, sticky dialog actions, export controls and generated cover artwork. New UI must follow the conventions in AGENTS.md. `dist/interactions.js` delegates feedback for favorite/unfavorite buttons and add-form checkboxes, so effects survive re-renders. Reduced-motion preferences suppress decorative bursts and replace the loading spinner with a static dotted indicator.

Progress controls use a dedicated responsive grid with aligned inputs/actions and explicit label/section spacing. Favorite-state hearts are no longer drawn inside cover portraits.

Settings → Motion offers Follow device, Play animations, and Reduce motion. Explicit app choices override the device preference for Folio only; decorative effects remain suppressed in Reduced mode.
