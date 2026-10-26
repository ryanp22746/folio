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


Library entries imported from providers share Search's source ratings, Steam review summaries, facts and attributed links. Opening an entry refreshes its metadata (five-minute browser freshness window); Refresh details retries explicitly. Cached details remain visible offline, and transient enrichment failures retain the last successful score. Refreshing never changes personal titles, ratings, favorites, notes, collections or progress. Older custom/sample entries offer Find live metadata & artwork: review a search result and explicitly connect it; titles alone never establish identity.

Search and Library use a shared themed artwork header. TMDB provides English/neutral PNG logos and backdrops; IGDB supplies transparent PNG logos plus artwork/screenshots; VNDB supplies only screenshots rated safe for both sexual and violent content. Artwork coverage varies, especially for music and manga. Missing/broken logos retain the accessible text heading; missing/broken backdrops use theme gradients. User-selected library artwork takes precedence, and renamed titles keep the text heading. Run the package check/test scripts, including test-metadata.cjs for library refresh/personal-field preservation and artwork fallbacks.


Media headers use a dedicated full-width cover/title grid, independent of the breadcrumb header. Covers, text titles and transparent logos share centered alignment and predictable spacing in both Search and Library; legacy library headers follow the same spacing. Settings panels have padded interiors and separated sections. Yotsuba Classic uses flat cream/peach surfaces, square borders, simple section bars, blue links and bracketed top navigation. All CSS gradients (including pseudo-elements) are suppressed only for Yotsuba; Forest and Dark retain their visual styles.


Opening Search details preserves the exact search-result snapshot, including order, filters, relevance signals and edition choices. Enriched detail responses never replace or remove result cards. Library settings → Connect existing library titles upgrades unlinked entries only when type/title/year match uniquely; books and music also require an exact normalized creator match. A pre-upgrade library/collection backup is kept in browser storage and can be exported there. Updates preserve entry IDs, collections and personal fields, keep custom artwork, re-read storage before each save and leave uncertain/provider-unavailable entries unchanged. Book discovery now uses Open Library.

The library update also verifies retained IDs and personal fields against the original backup and reports collection changes. Official VNDB localized titles and IGDB aliases support alternate-name matches; ambiguous movies can be checked against the saved director before connecting. Provider records without available artwork keep a themed fallback.
# Detail pages and availability

Search previews and library entries share accessible Cast/Crew (or Credits),
Details, Genres and Releases tabs. TMDB movies/TV include regional streaming,
rental and purchase listings with JustWatch/TMDB attribution. Select a country;
the preference is saved in this browser. Service rows open the returned TMDB
availability page, where viewing links can be selected. Prices and video quality
are not provided by this integration. Non-film media show explicit linked store,
listening or catalog pages when supplied. Missing data has a readable fallback.

Settings → Appearance includes Follow device, Subtle, Playful and Off motion
profiles. The shared motion layer animates dialogs, menus, disclosure content,
sidebar transitions and result reveals without delaying actions. Turning motion
off cancels active reveal effects and disables decorative CSS motion. Device
reduced-motion changes apply live in Follow device/Subtle. Decorative dot
patterns are separately optional; Yotsuba always stays flat.


Search and library controls stay available in a compact sticky bar. Open Filters for media, genre and other facets. Search uses provider keyword queries and title/alias/creator relevance; structured media filters are strict. Genre, platform, year and membership filters narrow loaded results and remain selected when a provider returns no matching facet. Keyword coverage depends on the provider; lyrics and plot descriptions are not universally indexed. Library keywords match saved titles, aliases, creators, credits, genres, media types and years locally.

Choose **Custom order** in the library sort menu to arrange titles and section dividers in Grid, List or Text. Drag a tile or grip, use the earlier/later buttons, or focus a grip and press Alt + an arrow key. Divider names are editable. Custom order is saved separately for the library and each collection, and included in library exports. Filtering preserves the underlying order; moving a visible item keeps hidden items in place relative to each other. Remove a divider without deleting its titles, and use Undo layout change to reverse the latest edit or reset.


Search autocomplete opens with up to six recent searches, saved only in this browser (20 total, with Clear history). Enter, suggestion selection and leaving a successfully completed search record the final query; intermediate keystrokes are not saved. Recalling a history entry restores its media/source filters. Suggestions index up to 600 known titles from the saved library and current-session provider results. A trie serves prefix matches; bounded Damerau edit distance handles misspellings; normalized aliases, creators and a small genre/media concept vocabulary supply related matches. This is lightweight local concept matching, not a remote embedding/LLM service or a universal semantic index of every provider. It adds no provider requests. Use arrow keys and Enter to select, Escape to close; input composition is supported.

Profiles are available from the main navigation. The initial profile is device-local: edit the display name, bio, avatar and banner, and choose up to four library titles for the showcase. No account or hosting connection is required.

Page zoom works throughout the app with Ctrl/Command + plus/minus, Ctrl/Command + 0 to reset, or Ctrl/Command + mouse wheel. The same controls are available under Settings → Appearance and are saved in this browser.

Search controls can collapse into a sticky query/filter summary; the preference is saved locally. Tags & features cycle through neutral, include and exclude, with All/Any inclusion matching. Options and counts adapt to the selected media and other tags: manga/anime demographics, game/VN platforms, music genres, book subjects, formats and supplied themes. Equivalent genre/platform labels share filter keys. Filters narrow loaded records, not the entire remote catalog; unknown metadata is never inferred. Choices are stored per media type for the session and can be cleared. The library uses the same filter logic.

Right-click media in library layouts, shelves, profile showcases, search, recommendations or creator works for context-appropriate actions. Shift+F10 opens the same menu from a focused tile. Parent segments in the page directory are links, including Library from Insights and collection views. Drag/drop reordering animates with the shared motion preference and retains keyboard move controls and Undo.

Spotify joins the shared music search and library flows when configured on the metadata API. Artist credits open source-qualified Spotify works in the existing creator directory. Album/track artwork stays square, the listening row links directly to its Spotify item, and personal ratings/progress remain local. Spotify has no audience-review score; missing metadata uses the existing clean fallbacks. Credentials and tokens never enter the browser. MusicBrainz-provided Spotify edition URLs can add matching Spotify metadata without guessing an artist identity from a name.

Creator discovery recognizes studio/artist phrasing and promotes verified connected works alongside title results, using available vote counts and provider relevance order. Autocomplete can open matching creator profiles. Profiles show supplied portraits, biographies and facts, with popular/newest/oldest/title sorting. Published creator links and matching source-qualified credits on an identified work can connect catalogs; ambiguous same-name people remain explicit choices. Anime character discovery uses bounded, exact-name/alias Jikan appearance relationships and keeps ordinary results available on failure. This is catalog-backed association, not a claim of a universal Netflix-style semantic index.

Albums in library and search include a Tracks section. Choose a verified catalog/edition, load further tracks or refresh, preview individual songs, and use the shared add form. Spotify, Apple and MusicBrainz supply track lists; MusicBrainz identifies the selected official edition. Apple songs now support their own detail/search records. Shared IDs and compatible title/year/artist evidence combine music sources; clean/explicit differences, track-count differences and materially different durations stay separate. Same-album versions and shared-ISRC recording releases are grouped as selectable editions rather than repeated search/creator tiles. Personal library entries are never deleted by this display grouping.


Full-series episode tracking: saved TMDB-backed shows expose an inline episode checklist under each season and a reversible season-completion button. Checklists are stored on the full-series library item, with source-qualified season/episode IDs; no child library entries are created. Numbered-season completion updates episode progress and status automatically; specials are separate. Manual counts require an explicit switch before using checklists and remain recorded as the previous manual count. Use manual progress returns to the existing editor. Unknown totals never automatically complete a series.

Album progress: song checkmarks are saved on the parent album per catalog edition, including disc/track slots. The overall track count and completion status update automatically. Load all pages before marking an entire album completed. Individual song library entries remain optional.

Movie collection and game series pages support parent-owned completion checklists. Each source-qualified member contributes once to the parent count; individual library entries remain optional and keep independent progress. Full-collection completion requires all membership pages to load successfully. Undoing a member reopens parent completion.

Reading progress: saved manga and books support independent numbered chapter, volume and page checklists, 50 visible units per page, mark-through and reversible bulk actions. Enter edition-specific counts when absent; ongoing works only auto-complete when the full-total option is selected. No child entries are created. Other media retain episode/track/collection checklists or hours/percentage progress as appropriate.


## Deploy v0.3.0

Deploy with the matching `folio-metadata-api` v0.3.0 tag. Build this repository's Dockerfile or run `node server.cjs` on Node 24. Set `HOST=0.0.0.0` inside a container and set `PORT` to the hosting platform's assigned port (default 5174). Outside containers, retain loopback binding behind a TLS reverse proxy.

Set `METADATA_API_BASE_URL` to the API's HTTPS URL and `METADATA_API_KEY` to the same secret on both services. The browser uses `/api/metadata/*` on the web origin; never expose credentials in `dist/`. The proxy accepts plain HTTP only for loopback local development.

Deploy the API first, verify `/healthz` and authenticated `/v1/providers`, then deploy the web server. Test a search, album detail, and creator works through the web URL. Record the previous revisions for rollback. Personal libraries are browser-local and origin-specific: the local library does not automatically follow a new hosted URL. Keep the exported JSON backup before moving to hosting; import/migration remains a separate step.
