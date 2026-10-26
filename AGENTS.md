# Frontend UI conventions

- Use semantic colors from `dist/themes.css` for new UI: surfaces, text, borders, accent, favorite and danger tokens. Keep palette literals in theme definitions rather than component rules.
- Check Forest (default), Dark and Yotsuba when changing visible UI. New themes should define the same token set.
- Portrait artwork must not include a favorite-status heart. Keep favorite actions outside cover artwork.
- Keep the portrait beside the title/logo in media popouts even when a backdrop is present. Provider artwork selections are local display preferences and must not overwrite metadata identities or personal edits.
- Favorite and unfavorite controls use the delegated feedback in `dist/interactions.js`, including reduced-motion support.

- Yotsuba is a flat classic imageboard layout: no gradients, square panels and controls, compact top navigation, and simple section bars. Keep these layout rules scoped to Yotsuba.

- Media details open as a popout by default, with an explicit expand/restore window control. Closing the preview resets it to popout size. Keep one vertical scroll owner and avoid negative-margin artwork layouts.
- Detail grid rows must size to their content so long overviews cannot collapse the information tabs or access links. Check a long-description visual novel when changing dialog layout.
- Yotsuba grid uses a classic thumbnail catalog: centered contained artwork, plain captions, and compact actions without framed cards.
- Library layouts include Grid, List with artwork, and Text without artwork. Keep shared artwork slots aligned without stretching square album art.
- Put the overview before personal activity; keep provider refresh controls, ratings, details and provenance at the bottom of saved-media views.
- Shared search/library information panels must use media-specific labels and sections. Keep supplied credit roles, distinguish publication/air/edition dates, and hide tabs without data rather than showing film sections for every medium.
- Credit names open the in-app creator browser. Keep source-qualified creator IDs; cross-source name matches require explicit selection and must never silently merge people. Preserve return navigation from a creator's work preview.
- Completion must be directly accessible in cards and popouts, visible with text/checkmarks, keyboard operable and reversible without changing progress, ratings or notes.
- Route new decorative animations through the shared motion preference. Off must cancel active effects; Follow device and Subtle honor reduced motion. Decorative patterns are separately optional and excluded from Yotsuba.
