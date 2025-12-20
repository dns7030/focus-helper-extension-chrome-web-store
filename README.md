# 🎯 Focus Helper - Chrome Extension

A Chrome extension that helps you stay focused by blocking distracting feeds on LinkedIn, Twitter/X, and YouTube, plus the ability to block entire domains.

## Features

- **Block LinkedIn Feed**: Hides the main feed on LinkedIn to prevent endless scrolling
- **Block Twitter "For You" Tab**: Automatically switches to "Following" tab and hides the algorithmic "For You" timeline (profile pages remain accessible)
- **Block YouTube Recommendations**: Hides homepage feed, sidebar recommendations, end screens, and comments to keep you focused
- **Block Entire Domains**: Add any website domain to completely block access
- **Easy Toggle Controls**: Enable/disable blocking for each platform independently
- **Beautiful UI**: Clean, modern interface with gradient design
- **Custom Block Page**: Blocked domains show a focus message with option to unblock

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
- Toggle YouTube recommendations blocking on/off
- Add/remove blocked domains

### What Gets Blocked

**LinkedIn:**
- Main feed/timeline on the home page
- Shows a focus message instead

**Twitter/X:**
- "For You" tab is hidden
- Automatically switches to "Following" tab on `/home`
- Profile pages, status pages, and other content remain fully accessible
- Sidebar recommendations ("What's happening", "Who to follow") are hidden on home page only

**YouTube:**
- Homepage feed/recommendations are completely hidden
- Sidebar recommendations on watch pages are blocked
- End screen video suggestions are hidden
- Comments section is hidden
- Search functionality remains available for finding specific videos

**Domain Blocking:**
- Enter any domain (e.g., `reddit.com`, `facebook.com`, `instagram.com`)
- The entire website will be blocked
- Blocked sites show a custom page with option to unblock
- Domains are saved across browser sessions

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
├── background.js          # Background service worker for domain blocking
├── popup.html             # Extension popup UI
├── popup.css              # Popup styling
├── popup.js               # Popup functionality
├── content-linkedin.js    # LinkedIn blocking script
├── content-twitter.js     # Twitter blocking script
├── content-youtube.js     # YouTube blocking script
├── blocked.html           # Blocked domain page
├── blocked.js             # Blocked page functionality
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
- **Content Scripts**: Injected into LinkedIn, Twitter, and YouTube pages to hide feed elements
- **MutationObserver**: Watches for dynamic content loading to continuously block feeds
- **Chrome Storage API**: Saves your preferences across browser sessions
- **CSS Injection**: Hides unwanted elements and displays focus messages
- **SPA Detection**: Handles URL changes in single-page applications like Twitter and YouTube

## Permissions

- `storage`: Save your blocking preferences and domain list
- `activeTab`: Interact with the current tab
- `tabs`: Reload tabs when settings change
- `declarativeNetRequest`: Block domains at the network level
- `host_permissions`: Access LinkedIn, Twitter/X, YouTube, and all domains for blocking

## Troubleshooting

**Extension not working?**
1. Make sure you've created the icon files (see "Creating Icons" section)
2. Reload the extension on `chrome://extensions/`
3. Refresh the LinkedIn or Twitter page
4. Check that the toggle is enabled in the popup

**Still seeing feeds?**
- LinkedIn, Twitter, and YouTube frequently update their HTML structure
- The selectors in the content scripts may need updating
- Open an issue or modify the selectors in `content-linkedin.js`, `content-twitter.js`, or `content-youtube.js`

**Twitter profile pages not showing posts?**
- This issue has been fixed in v1.2.0
- Profile pages, status pages, and search results now work correctly
- Only the home feed "For You" tab is blocked

## Development

To modify the extension:

1. Edit the relevant files
2. Go to `chrome://extensions/`
3. Click the refresh icon on the Focus Helper card
4. Reload any open LinkedIn/Twitter/YouTube tabs

## Privacy

This extension:
- ✅ Runs entirely locally in your browser
- ✅ Does not collect any data
- ✅ Does not make external network requests
- ✅ Only accesses LinkedIn, Twitter, and YouTube pages you visit

## License

MIT License - Feel free to modify and distribute

## Contributing

Found a bug or want to add a feature? Feel free to:
1. Fork the repository
2. Make your changes
3. Submit a pull request

## Changelog

### v1.2.0 (Latest)
- ✅ Added YouTube recommendations blocking (homepage, sidebar, end screens, comments)
- ✅ Fixed Twitter profile pages not showing posts
- ✅ Improved Twitter blocking to only affect home feed
- ✅ Profile pages, status pages, and search results now work correctly on Twitter

### v1.1.0
- Added domain blocking feature
- Added master toggle functionality
- Fixed LinkedIn SPA navigation
- Fixed domain matching
- Added Twitter sidebar blocking

### v1.0.0
- Initial release
- LinkedIn feed blocking
- Twitter "For You" tab blocking

## Future Enhancements

Potential features to add:
- [ ] Block Facebook News Feed
- [ ] Block Instagram Explore
- [ ] Block Reddit Popular/All
- [ ] Toggle for YouTube comments separately
- [ ] Custom block schedules (e.g., only during work hours)
- [ ] Statistics tracking (time saved)
- [ ] Whitelist specific YouTube channels
- [ ] Password protection for settings

---

**Stay focused and productive! 🎯**
