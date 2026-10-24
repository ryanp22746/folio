# Frontend UI conventions

- Use semantic colors from `dist/themes.css` for new UI: surfaces, text, borders, accent, favorite and danger tokens. Keep palette literals in theme definitions rather than component rules.
- Check Forest (default), Dark and Yotsuba when changing visible UI. New themes should define the same token set.
- Portrait artwork must not include a favorite-status heart. Keep favorite actions outside cover artwork.
- Favorite and unfavorite controls use the delegated feedback in `dist/interactions.js`, including reduced-motion support.
