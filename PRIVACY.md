# Privacy Policy for Focus Helper

_Last updated: June 7, 2025_

## Summary

Focus Helper does not collect, transmit, or share any personal data. All settings are stored locally in your browser.

## Data Storage

Focus Helper stores the following preferences using Chrome's built-in `storage.sync` API:

- Your list of blocked domains and allowed subdomains
- Your toggle states (LinkedIn, Twitter, YouTube blocking on/off)
- Your redirect URL for blocked domains

This data is stored in your browser and, if Chrome Sync is enabled, is synced across your own devices via Google's infrastructure as part of the normal Chrome Sync service. Focus Helper has no servers of its own and never receives this data.

## Data We Do Not Collect

- We do not collect any browsing history
- We do not collect any personal information
- We do not use analytics or tracking
- We do not sell or share any data with third parties

## Permissions

Focus Helper requests the following permissions solely to provide its blocking functionality:

- **storage** — to save your settings
- **declarativeNetRequest** — to redirect blocked domains
- **activeTab / tabs** — to detect page URL changes on single-page apps (LinkedIn, Twitter, YouTube)
- **host permissions** — to run content scripts on LinkedIn, Twitter, and YouTube

## Contact

If you have any questions, open an issue at [github.com/dns7030/focus-helper-extension](https://github.com/dns7030/focus-helper-extension).
