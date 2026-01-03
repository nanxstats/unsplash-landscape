document.addEventListener('DOMContentLoaded', () => {
    const landscapeToggle = document.getElementById('landscapeOnly');
    const plusToggle = document.getElementById('excludePlus');
    const promotedToggle = document.getElementById('hidePromoted');
    const refreshBtn = document.getElementById('refreshBtn');

    // Load saved settings
    chrome.storage.local.get(['landscapeOnly', 'excludePlus', 'hidePromoted'], (result) => {
        if (result.landscapeOnly !== undefined) {
            landscapeToggle.checked = result.landscapeOnly;
        }
        if (result.excludePlus !== undefined) {
            plusToggle.checked = result.excludePlus;
        }
        if (result.hidePromoted !== undefined) {
            promotedToggle.checked = result.hidePromoted;
        }
    });

    // Save settings when toggled
    const saveSettings = () => {
        chrome.storage.local.set({
            landscapeOnly: landscapeToggle.checked,
            excludePlus: plusToggle.checked,
            hidePromoted: promotedToggle.checked
        });
    };

    landscapeToggle.addEventListener('change', saveSettings);
    plusToggle.addEventListener('change', saveSettings);
    promotedToggle.addEventListener('change', saveSettings);

    // Send message to content script to refresh filters
    refreshBtn.addEventListener('click', () => {
        saveSettings();
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]) {
                chrome.tabs.sendMessage(tabs[0].id, { action: 'refresh' }, (response) => {
                    // If content script isn't loaded (e.g. not on Unsplash), reload the page if it's Unsplash
                    if (chrome.runtime.lastError || !response) {
                        chrome.tabs.reload(tabs[0].id);
                    }
                });
            }
            // Provide feedback
            refreshBtn.textContent = 'Settings Applied!';
            refreshBtn.style.backgroundColor = 'var(--success)';
            setTimeout(() => {
                refreshBtn.textContent = 'Apply & Refresh Page';
                refreshBtn.style.backgroundColor = 'var(--accent)';
            }, 2000);
        });
    });
});
