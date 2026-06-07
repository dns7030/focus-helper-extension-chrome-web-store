// LinkedIn Feed Blocker
(function() {
  'use strict';

  let isEnabled = true;

  chrome.storage.sync.get(['linkedinEnabled'], function(result) {
    isEnabled = result.linkedinEnabled !== false;
    if (isEnabled) blockFeed();
  });

  chrome.storage.onChanged.addListener(function(changes) {
    if (changes.linkedinEnabled) {
      isEnabled = changes.linkedinEnabled.newValue;
      if (isEnabled) blockFeed();
      else unblockFeed();
    }
  });

  function blockFeed() {
    const observer = new MutationObserver(function() {
      if (isEnabled) hideFeedElements();
    });

    if (document.body) {
      observer.observe(document.body, { childList: true, subtree: true });
    } else {
      document.addEventListener('DOMContentLoaded', function() {
        observer.observe(document.body, { childList: true, subtree: true });
      });
    }

    // Listen for SPA URL changes
    let lastUrl = location.href;
    new MutationObserver(() => {
      const currentUrl = location.href;
      if (currentUrl !== lastUrl) {
        lastUrl = currentUrl;
        hideFeedElements();
        setTimeout(hideFeedElements, 300);
        setTimeout(hideFeedElements, 1000);
      }
    }).observe(document, { subtree: true, childList: true });

    hideFeedElements();
  }

  function hideFeedElements() {
    if (!isEnabled) {
      removeFeedBlock();
      return;
    }

    const currentPath = window.location.pathname;
    const isFeedPage = currentPath === '/feed/' || currentPath === '/feed' || currentPath === '/';

    if (!isFeedPage) {
      removeFeedBlock();
      return;
    }

    if (!document.querySelector('#focus-helper-feed-block')) {
      const style = document.createElement('style');
      style.id = 'focus-helper-feed-block';
      style.textContent = `
        [data-testid="mainFeed"],
        section[aria-label="Primary content"] {
          display: none !important;
        }
      `;
      (document.head || document.documentElement).appendChild(style);
    }
  }

  function removeFeedBlock() {
    const style = document.querySelector('#focus-helper-feed-block');
    if (style) style.remove();
  }

  function unblockFeed() {
    removeFeedBlock();
  }
})();
