# Unsplash Landscape

A Chrome extension designed to make your Unsplash experience more productive. It filters for landscape photos and excludes Unsplash+ (premium) content, making it productive for finding clean hero images for blogs and articles.

## Features

- **Landscape Filter**: One-click toggle to hide all portrait and square images, focusing exclusively on horizontal shots.
- **Hide Unsplash+**: Automatically filters out subscriber-only content, ensuring all visible photos are free to use.
- **Native Search Optimization**: When searching, the extension automatically applies Unsplash's native `orientation=landscape` and `license=free` filters for the best performance and highest quality results.
- **Dynamic Grid Updates**: Uses a background `MutationObserver` to ensure new images are filtered instantly as you scroll through the infinite grid.
- **Premium Dark UI**: A modern, glassmorphic popup interface with smooth transitions and persistence.

## Installation

1.  Clone this repository or download the source code.
2.  Open Chrome and navigate to `chrome://extensions/`.
3.  Enable **Developer mode** in the top right corner.
4.  Click **Load unpacked**.
5.  Select the `unsplash-landscape` directory.

## Usage

- Click the extension icon in your browser toolbar to open the settings.
- Toggle **Landscape Only** or **Exclude Unsplash+** as desired.
- Click **Apply & Refresh Page** to persist your changes and immediately update the current tab.
- On search pages, the extension will automatically redirect to the filtered view if parameters are missing.

## Tech stack

- **HTML/CSS/JS**: Vanilla implementation for zero overhead.
- **Chrome Extension API**: Uses `storage.local` for settings persistence and `tabs` messaging.
- **Modern UI**: Custom CSS with gradients, glassmorphism, and Inter typography.
