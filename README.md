# Unsplash Landscape

A Chrome extension designed to make your Unsplash experience productive by filtering for landscape photos and excluding premium or promoted content.

## Features

The extension provides the following key features that can be toggled off independently:

- **Landscape filter**: One-click toggle to hide all portrait and square images, to focus on horizontal photos.
- **Hide Unsplash+ images**: Filters out subscriber-only content.
- **Hide promoted images**: Removes promoted content from the grid.

The implementation focuses on performance and user experience:

- **Native search optimization**: When searching, automatically applies Unsplash's native `orientation=landscape` and `license=free` filters.
- **Dynamic grid updates**: Uses a background `MutationObserver` to ensure new images are filtered instantly as you scroll through the infinite grid.
- **Smart scroll**: eliminating "flashing" of hidden images and automatically loading more content to fill gaps.
- **Layout equalizer**: Keeps grid columns balanced even when many images are filtered out, ensuring a smooth scrolling experience.

## Installation

1. Clone this repository or download the source code.
2. Open Chrome and navigate to `chrome://extensions/`.
3. Enable **Developer mode** in the top right corner.
4. Click **Load unpacked**.
5. Select the `unsplash-landscape` directory.

## Usage

- Click the extension icon in your browser toolbar to open the settings.
- Toggle **Landscape Only**, **Exclude Unsplash+**, and **Hide Promoted** as desired.
- Click **Apply & Refresh Page** to persist your changes and immediately update the current tab.
- On search pages, the extension will automatically redirect to the filtered view if parameters are missing.

## Tech stack

- **HTML/CSS/JS**: Vanilla implementation for zero overhead.
- **Chrome extension API**: Uses `storage.local` for settings persistence and `tabs` messaging.
- **Modern UI**: Custom CSS with gradients, glassmorphism, and Inter typography.
