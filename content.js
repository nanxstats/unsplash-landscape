// Helper to check if an image is Unsplash+
const isUnsplashPlus = (element) => {
    // Check for the /plus path in any link within the container
    const plusLink = element.querySelector('a[href*="/plus"]');
    if (plusLink) return true;

    // Check for "Unsplash+" text in badges or overlays
    const textContent = element.textContent || "";
    if (textContent.includes("Unsplash+")) return true;

    // Check for specific premium classes observed during research
    const premiumOverlay = element.querySelector('[class*="unsplashPlusLink-"]');
    if (premiumOverlay) return true;

    return false;
};

// Helper to check if an image is Promoted
const isPromoted = (element) => {
    // Check for "Promoted" text in potential sponsor labels
    // We look for specific text "Promoted" which is usually in a span or div
    // We also check for the advertise link which is a very strong signal
    const advertiseLink = element.querySelector('a[href*="/advertise"]');
    if (advertiseLink) return true;

    // Fallback: check text content for "Promoted" but be careful not to catch partial matches in titles
    // The "Promoted" label is usually short and standalone.
    // We can search specifically within elements that might contain it if we knew the class,
    // but the user provided classes are hashed.
    // However, the "Promoted" text appears in: <a ...>Promoted</a>
    const links = element.querySelectorAll('a');
    for (const link of links) {
        if (link.textContent.trim() === 'Promoted') return true;
    }

    return false;
};

// Helper to check if an image is landscape
const isLandscape = (img) => {
    if (!img) return true; // Fail safe
    const width = parseInt(img.getAttribute('width')) || img.naturalWidth || img.width;
    const height = parseInt(img.getAttribute('height')) || img.naturalHeight || img.height;

    // If we can't get dimensions, we assume it's fine for now or handle it later
    if (!width || !height) return true;

    return width > height;
};

// Main filter function
const filterImages = () => {
    chrome.storage.local.get(['landscapeOnly', 'excludePlus', 'hidePromoted'], (settings) => {
        const { landscapeOnly = true, excludePlus = true, hidePromoted = true } = settings;

        // Target photo containers (figures or specific divs)
        // We look for elements that haven't been marked as invalid yet to avoid re-processing unnecessarily,
        // but we must re-check everything in case settings changed.
        const containers = document.querySelectorAll('figure, div[data-testid="photo-grid-multi-col-figure"], div[data-testid="asset-grid-masonry-figure"]');

        let hiddenCount = 0;

        containers.forEach(container => {
            let shouldHide = false;

            const img = container.querySelector('img');

            if (landscapeOnly && !isLandscape(img)) {
                shouldHide = true;
            }

            if (excludePlus && isUnsplashPlus(container)) {
                shouldHide = true;
            }

            if (hidePromoted && isPromoted(container)) {
                shouldHide = true;
            }

            if (shouldHide) {
                container.setAttribute('data-filtered', 'hidden');
                hiddenCount++;
            } else {
                // Mark as valid to reveal it (CSS handles the opacity transition)
                container.setAttribute('data-filtered', 'valid');
            }
        });

        // After filtering, check if we need to load more
        if (hiddenCount > 0) {
            checkViewportFill();
        }

        // Run the equalizer
        balanceColumns(containers);
    });
};

/* --- Layout Equalizer --- */
const balanceColumns = (containers) => {
    // 1. Identify Columns
    const columnsMap = new Map();
    containers.forEach(container => {
        const parent = container.parentElement;
        if (!columnsMap.has(parent)) {
            columnsMap.set(parent, []);
        }
        columnsMap.get(parent).push(container);
    });

    const columns = Array.from(columnsMap.keys());

    // Only proceed if we have multiple columns (usually 2 or 3)
    if (columns.length < 2) return;

    // 2. "Reset" Phase: Unhide everything temporarily to measure true heights.
    // We are trusting the browser's layout cycle here. 
    // Changes to display/classes within the same synchronous execution block 
    // allow us to read updated offsets (causing reflow) but won't paint until we finish.
    containers.forEach(c => {
        if (c.getAttribute('data-balanced') === 'hidden') {
            c.removeAttribute('data-balanced');
        }
    });

    // 3. Measure Heights
    // We use scrollHeight to get the full height of the column content
    const heights = columns.map(c => c.scrollHeight);
    const minHeight = Math.min(...heights);

    // Threshold: Allow columns to be taller than the shortest one by this amount (e.g., 1000px).
    // An average portrait is maybe 600-800px. 1000px gives a buffer of ~2 images.
    // If it's too tight, scrolling feels "stuck" because the tall columns end abruptly.
    // If it's too loose, the "imbalance" is visible.
    const threshold = 1000;
    const limit = minHeight + threshold;

    // 4. Hide Excess
    columns.forEach((col, index) => {
        if (heights[index] > limit) {
            // This column is too tall. We need to hide items starting from the bottom
            // until we are effectively back under the limit (visually).

            // We only hide items that are currently "valid" (visible). 
            // We ignored "hidden" (filtered) items already.

            // We get the items in THESE columns from our map, reverse them to start from bottom
            const items = columnsMap.get(col).reverse();

            for (const item of items) {
                // Skip if already filtered out by the main filter (landscape check)
                if (item.getAttribute('data-filtered') === 'hidden') continue;

                // Check position
                // Note: offsetTop is relative to the offsetParent (which is likely the column or container).
                // We use (offsetTop + offsetHeight) to find the bottom edge of the image.
                const bottomEdge = item.offsetTop + item.offsetHeight;

                if (bottomEdge > limit) {
                    item.setAttribute('data-balanced', 'hidden');
                } else {
                    // Once we hit an item that is within the limit, we stop hiding for this column
                    // because everything above it is definitely within limit (ascending order).
                    break;
                }
            }
        }
    });

    // Note: We don't verify filling here, `checkViewportFill` handles the "too empty" case 
    // which might occur if minHeight is very small.
};

/* --- Gap Filling / Aggressive Loading --- */
const checkViewportFill = () => {
    // If the distance to the bottom of the page is small, or if the document height is 
    // suspiciously close to the viewport height (meaning content was hidden), trigger a scroll.

    const scrollBottom = window.scrollY + window.innerHeight;
    const docHeight = document.documentElement.scrollHeight;

    // Threshold: if we are within 2 viewports of the bottom, load more.
    // Unsplash usually triggers slightly before the bottom.
    // If we hid a lot of stuff, the "bottom" might have effectively moved up.
    if (docHeight - scrollBottom < window.innerHeight * 2) {
        // Nudge scroll to trigger Unsplash's infinite scroll listener
        // We use a small scrollBy. If we are already at the bottom, this might not do much,
        // so we might need to verify if distinct "load more" button exists (rare in infinite scroll).
        // A tiny scroll event often wakes up the framework.
        window.scrollBy(0, 1);
        window.scrollBy(0, -1);
    }
};

/* --- CSS Pre-hiding --- */
const injectStyles = () => {
    const style = document.createElement('style');
    style.textContent = `
        /* Hide potentially problematic containers by default until verified */
        figure:not([data-filtered]),
        div[data-testid="photo-grid-multi-col-figure"]:not([data-filtered]),
        div[data-testid="asset-grid-masonry-figure"]:not([data-filtered]) {
            opacity: 0 !important;
        }

        /* Reveal valid ones smoothly */
        [data-filtered="valid"] {
            opacity: 1 !important;
            transition: opacity 0.2s ease-in;
        }

        /* Keep invalid ones hidden (display: none takes them out of layout) */
        [data-filtered="hidden"],
        [data-balanced="hidden"] {
            display: none !important;
        }
    `;
    document.head.appendChild(style);
};

// Handle Search Redirection
const handleSearchFilters = () => {
    chrome.storage.local.get(['landscapeOnly', 'excludePlus', 'hidePromoted'], (settings) => {
        const { landscapeOnly = true, excludePlus = true } = settings;

        const url = new URL(window.location.href);

        // Target search result pages
        if (!url.pathname.startsWith('/s/photos/')) return;

        let changed = false;

        if (landscapeOnly && url.searchParams.get('orientation') !== 'landscape') {
            url.searchParams.set('orientation', 'landscape');
            changed = true;
        }

        if (excludePlus && url.searchParams.get('license') !== 'free') {
            url.searchParams.set('license', 'free');
            changed = true;
        }

        if (changed) {
            // Replace allows going back without getting stuck in a loop
            window.location.replace(url.toString());
        }
    });
};

// Periodic check for URL changes (necessary for SPAs where history API might not trigger popstate on pushState)
let lastUrl = location.href;
const checkUrlChange = () => {
    if (location.href !== lastUrl) {
        lastUrl = location.href;
        handleSearchFilters();
        filterImages();
    }
};

// Observe changes for infinite scroll
const observer = new MutationObserver(() => {
    filterImages();
    checkUrlChange(); // Catch any URL changes during scroll/navigation
});

// Initialize
const init = () => {
    injectStyles(); // Add CSS first
    handleSearchFilters();
    filterImages();

    // Observe the whole body for added images
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    // Listen for back/forward navigation
    window.addEventListener('popstate', () => {
        handleSearchFilters();
        filterImages();
    });
};

// Run init
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'refresh') {
        handleSearchFilters();
        filterImages();
        sendResponse({ status: 'done' });
    }
});
