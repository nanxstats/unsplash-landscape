# AGENTS.md

This document serves as a technical reference for AI agents maintaining or extending the Unsplash Landscape project.

## Technical context

### DOM selectors

Unsplash frequently updates its class names via CSS modules. Rely on semantic tags or `data-testid` where possible:
- **Image Containers**: Primary grid elements are `<figure>`. Some variations use `div[data-testid="asset-grid-masonry-figure"]`.
- **Premium Indicators**: Look for the string "Unsplash+" within a container or links containing `/plus`.
- **Infinite Scroll**: Handled via `MutationObserver` in `content.js`. Any DOM manipulation must be re-run on subtree additions.

### Search query parameters

*Proactive redirection is the primary filtering strategy for search pages.* To leverage server-side filtering (more performant and cleaner than DOM hiding):

- `orientation=landscape`: Forces horizontal images.
- `license=free`: Excludes premium/contributor-only results.
- **Redirection logic**: `content.js` monitors URL changes via `popstate` and `MutationObserver` checks. If parameters are missing on `/s/photos/*` paths, it triggers a `window.location.replace()`.
- **SPA note**: Unsplash uses client-side routing. Redirection must be triggered even when the browser doesn't do a full page reload.

### Settings persistence

- Uses `chrome.storage.local`.
- Any change in the popup sends a message (`action: 'refresh'`) to active tabs to trigger immediate DOM re-filtering without requiring a full page reload if possible (though some state transitions require reload).

## Recommended patterns

### DOM filtering

When hiding elements in the DOM, always use `element.style.display = 'none'`. Do not remove elements from the DOM, as this can break Unsplash's own React/internal state and cause layout jitters during infinite scroll.

### UI consistency

Maintain the "Premium" aesthetic defined in `popup.css`:
- **Theme**: High-contrast dark mode (`#0d1117`).
- **Typography**: Inter (via Google Fonts).
- **Effects**: Glassmorphism (`rgba(...)` backgrounds with subtle blurs) and vibrant blue accents (`#1f6feb`).

## Common pitfalls

1. **Race conditions**: `MutationObserver` may fire multiple times for a single load. Ensure `filterImages` is idempotent.
2. **Selector fragility**: If filtering stops working, verify if `data-testid` or the internal structure of `<figure>` has changed.
3. **Cross-origin**: The extension requires `host_permissions` for `https://unsplash.com/*` to interact with search parameters and the DOM.
