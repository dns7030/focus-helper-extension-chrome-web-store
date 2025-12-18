# 🎯 Focus Helper - Chrome Extension

A Chrome extension that helps you stay focused by blocking distracting feeds on LinkedIn and Twitter/X.

## Features

- **Block LinkedIn Feed**: Hides the main feed on LinkedIn to prevent endless scrolling
- **Block Twitter "For You" Tab**: Automatically redirects to "Following" and blocks the algorithmic "For You" timeline
- **Easy Toggle Controls**: Enable/disable blocking for each platform independently
- **Beautiful UI**: Clean, modern interface with gradient design

## Installation

### Load Unpacked Extension (Development Mode)

1. **Open Chrome Extensions Page**
   - Navigate to `chrome://extensions/`
   - Or click the three dots menu → More Tools → Extensions

2. **Enable Developer Mode**
   - Toggle the "Developer mode" switch in the top-right corner

3. **Load the Extension**
   - Click "Load unpacked"
   - Navigate to the `focusBrowserExtension` folder
   - Click "Select Folder"

4. **Pin the Extension** (Optional)
   - Click the puzzle piece icon in Chrome toolbar
   - Find "Focus Helper" and click the pin icon

## Usage

### Control Panel
Click the extension icon to open the control panel where you can:
- Toggle LinkedIn feed blocking on/off
- Toggle Twitter "For You" blocking on/off

### What Gets Blocked

**LinkedIn:**
- Main feed/timeline on the home page
- Shows a focus message instead

**Twitter/X:**
- "For You" tab is hidden
- Automatically redirects to "Following" tab
- Shows a focus message if you try to access "For You"

## Creating Icons

The extension needs icon files. To create them:

1. Open `icons/create-icons.html` in your browser
2. Right-click each canvas and save as PNG:
   - `icon16.png`
   - `icon32.png`
   - `icon48.png`
   - `icon128.png`
3. Save all icons in the `icons/` folder

Alternatively, you can create your own icons with any image editor. The icons should be:
- Square (equal width and height)
- PNG format
- Sizes: 16x16, 32x32, 48x48, 128x128 pixels

## File Structure

```
focusBrowserExtension/
├── manifest.json           # Extension configuration
├── popup.html             # Extension popup UI
├── popup.css              # Popup styling
├── popup.js               # Popup functionality
├── content-linkedin.js    # LinkedIn blocking script
├── content-twitter.js     # Twitter blocking script
├── styles.css             # Global injected styles
├── icons/                 # Extension icons
│   ├── icon16.png
│   ├── icon32.png
│   ├── icon48.png
│   └── icon128.png
└── README.md             # This file
```

## How It Works

The extension uses:
- **Content Scripts**: Injected into LinkedIn and Twitter pages to hide feed elements
- **MutationObserver**: Watches for dynamic content loading to continuously block feeds
- **Chrome Storage API**: Saves your preferences across browser sessions
- **CSS Injection**: Hides unwanted elements and displays focus messages

## Permissions

- `storage`: Save your blocking preferences
- `activeTab`: Interact with the current tab
- `host_permissions`: Access LinkedIn and Twitter/X domains

## Troubleshooting

**Extension not working?**
1. Make sure you've created the icon files (see "Creating Icons" section)
2. Reload the extension on `chrome://extensions/`
3. Refresh the LinkedIn or Twitter page
4. Check that the toggle is enabled in the popup

**Still seeing feeds?**
- LinkedIn and Twitter frequently update their HTML structure
- The selectors in the content scripts may need updating
- Open an issue or modify the selectors in `content-linkedin.js` or `content-twitter.js`

## Development

To modify the extension:

1. Edit the relevant files
2. Go to `chrome://extensions/`
3. Click the refresh icon on the Focus Helper card
4. Reload any open LinkedIn/Twitter tabs

## Privacy

This extension:
- ✅ Runs entirely locally in your browser
- ✅ Does not collect any data
- ✅ Does not make external network requests
- ✅ Only accesses LinkedIn and Twitter pages you visit

## License

MIT License - Feel free to modify and distribute

## Contributing

Found a bug or want to add a feature? Feel free to:
1. Fork the repository
2. Make your changes
3. Submit a pull request

## Future Enhancements

Potential features to add:
- [ ] Block Facebook News Feed
- [ ] Block Instagram Explore
- [ ] Block Reddit Popular/All
- [ ] Custom block schedules (e.g., only during work hours)
- [ ] Statistics tracking (time saved)
- [ ] Whitelist specific accounts
- [ ] Password protection for settings

---

**Stay focused and productive! 🎯**
