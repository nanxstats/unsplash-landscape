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
    chrome.storage.local.get(['landscapeOnly', 'excludePlus'], (settings) => {
        const { landscapeOnly = true, excludePlus = true } = settings;

        // Target photo containers (figures or specific divs)
        const containers = document.querySelectorAll('figure, div[data-testid="photo-grid-multi-col-figure"], div[data-testid="asset-grid-masonry-figure"]');

        containers.forEach(container => {
            let shouldHide = false;

            const img = container.querySelector('img');

            if (landscapeOnly && !isLandscape(img)) {
                shouldHide = true;
            }

            if (excludePlus && isUnsplashPlus(container)) {
                shouldHide = true;
            }

            if (shouldHide) {
                container.style.display = 'none';
            } else {
                // Reset if settings changed or it was previously hidden
                container.style.display = '';
            }
        });
    });
};

// Handle Search Redirection to leverage Unsplash's native filters
const handleSearchFilters = () => {
    chrome.storage.local.get(['landscapeOnly', 'excludePlus'], (settings) => {
        const { landscapeOnly = true, excludePlus = true } = settings;

        const url = new URL(window.location.href);
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
            window.location.replace(url.toString());
        }
    });
};

// Observe changes for infinite scroll
const observer = new MutationObserver((mutations) => {
    filterImages();
});

// Initialize
const init = () => {
    handleSearchFilters();
    filterImages();

    // Observe the whole body for added images
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
};

// Run init
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// Listen for messages from popup to re-filter immediately
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'refresh') {
        handleSearchFilters();
        filterImages();
        sendResponse({ status: 'done' });
    }
});
