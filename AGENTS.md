# AGENTS.md

This document serves as a technical reference for AI agents maintaining or extending the Unsplash Landscape project.

## Technical context

### DOM selectors

Unsplash frequently updates its class names via CSS modules. Rely on semantic tags or `data-testid` where possible:
- **Image containers**: Primary grid elements are `<figure>`. Some variations use `div[data-testid="asset-grid-masonry-figure"]`.
- **Premium indicators**: Look for the string "Unsplash+" within a container or links containing `/plus`.
- **Promoted content**: Identified by links to `/advertise` or text content "Promoted".
- **Infinite scroll**: Handled via `MutationObserver` in `content.js`. Any DOM manipulation must be re-run on subtree additions.

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

### Smart UX features

To handle the side effects of aggressive filtering (for example, flashing content, empty viewports, unbalanced columns), the following mechanisms are in place:

1.  **CSS pre-hiding**: Global styles inject `opacity: 0` for all new image containers by default. They are only revealed (`opacity: 1`) after `content.js` validates them. This prevents "flashing" of filtered content.
2.  **Gap filling**: A `checkViewportFill()` function triggers a micro-scroll event if the viewport becomes too empty after filtering, forcing Unsplash's infinite scroll to load the next batch immediately.
3.  **Layout equalizer**: `balanceColumns()` monitors the height of the grid columns. If one column grows significantly taller than others (due to filtering skew), the script temporarily hides the bottom-most images in that column to keep the bottom edge of the grid aligned.

### UI consistency

Maintain the "Premium" aesthetic defined in `popup.css`:
- **Theme**: High-contrast dark mode (`#0d1117`).
- **Typography**: Native font stack.
- **Effects**: Glassmorphism (`rgba(...)` backgrounds with subtle blurs) and vibrant blue accents (`#1f6feb`).

## Common pitfalls

1. **Race conditions**: `MutationObserver` may fire multiple times for a single load. Ensure `filterImages` is idempotent.
2. **Selector fragility**: If filtering stops working, verify if `data-testid` or the internal structure of `<figure>` has changed.
3. **Cross-origin**: The extension requires `host_permissions` for `https://unsplash.com/*` to interact with search parameters and the DOM.
