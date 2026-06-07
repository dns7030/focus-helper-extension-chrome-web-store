// YouTube Recommendations Blocker
(function() {
  'use strict';

  let isEnabled = true;

  // Load settings from storage
  chrome.storage.sync.get(['youtubeEnabled'], function(result) {
    isEnabled = result.youtubeEnabled !== false;
    if (isEnabled) blockRecommendations();
  });

  // Listen for settings changes
  chrome.storage.onChanged.addListener(function(changes) {
    if (changes.youtubeEnabled) {
      isEnabled = changes.youtubeEnabled.newValue;
      if (isEnabled) blockRecommendations();
      else unblockRecommendations();
    }
  });

  function blockRecommendations() {
    addBlockingStyles();

    const observer = new MutationObserver(function() {
      if (isEnabled) hideRecommendations();
    });

    if (document.body) {
      observer.observe(document.body, { childList: true, subtree: true });
    } else {
      document.addEventListener('DOMContentLoaded', function() {
        observer.observe(document.body, { childList: true, subtree: true });
      });
    }

    // Listen for URL changes (YouTube is a SPA)
    let lastUrl = location.href;
    new MutationObserver(() => {
      const currentUrl = location.href;
      if (currentUrl !== lastUrl) {
        lastUrl = currentUrl;
        setTimeout(hideRecommendations, 100);
      }
    }).observe(document, { subtree: true, childList: true });

    hideRecommendations();
  }

  function hideRecommendations() {
    if (!isEnabled) return;

    const currentPath = window.location.pathname;
    const isHomePage = currentPath === '/' || currentPath === '';
    const isWatchPage = currentPath.startsWith('/watch');
    const isChannelPage = currentPath.startsWith('/@') || currentPath.startsWith('/channel/') || currentPath.startsWith('/c/');

    if (isChannelPage) return;

    if (isHomePage) blockHomepageFeed();

    if (isWatchPage) {
      blockWatchPageSidebar();
      blockEndScreens();
    }

    if (currentPath.startsWith('/shorts')) blockShorts();
  }

  function blockHomepageFeed() {
    const feedSelectors = [
      'ytd-browse[page-subtype="home"]',
      'ytd-two-column-browse-results-renderer',
      '#contents.ytd-rich-grid-renderer',
      'ytd-rich-grid-renderer',
      'ytd-rich-item-renderer',
      'ytd-rich-section-renderer'
    ];

    feedSelectors.forEach(selector => {
      document.querySelectorAll(selector).forEach(el => {
        el.classList.add('focus-helper-blocked');
      });
    });
  }

  function blockWatchPageSidebar() {
    const sidebarSelectors = [
      '#related',
      'ytd-compact-video-renderer',
      'ytd-compact-autoplay-renderer'
    ];

    sidebarSelectors.forEach(selector => {
      document.querySelectorAll(selector).forEach(el => {
        el.classList.add('focus-helper-sidebar-blocked');
      });
    });
  }

  function blockEndScreens() {
    const endScreenSelectors = [
      '.ytp-ce-element:not(.ytp-ce-playlist)',
      '.ytp-endscreen-content',
      '.ytp-ce-covering-overlay',
      '.ytp-ce-element-show:not(.ytp-ce-playlist)',
      '.ytp-ce-video'
    ];

    endScreenSelectors.forEach(selector => {
      document.querySelectorAll(selector).forEach(el => {
        el.classList.add('focus-helper-blocked');
      });
    });
  }

  function blockShorts() {
    ['ytd-reel-video-renderer', 'ytd-shorts', '#shorts-container'].forEach(selector => {
      document.querySelectorAll(selector).forEach(el => {
        el.classList.add('focus-helper-blocked');
      });
    });
  }

  function addBlockingStyles() {
    if (document.querySelector('#focus-helper-youtube-styles')) return;

    const style = document.createElement('style');
    style.id = 'focus-helper-youtube-styles';
    style.textContent = `
      .focus-helper-blocked {
        display: none !important;
      }

      .focus-helper-sidebar-blocked {
        display: none !important;
      }

      /* Block comments */
      ytd-comments#comments,
      #comments.ytd-watch-flexy,
      ytd-comments-header-renderer,
      ytd-comment-thread-renderer {
        display: none !important;
      }
    `;
    (document.head || document.documentElement).appendChild(style);
  }

  function unblockRecommendations() {
    const style = document.querySelector('#focus-helper-youtube-styles');
    if (style) style.remove();

    document.querySelectorAll('.focus-helper-blocked').forEach(el => {
      el.classList.remove('focus-helper-blocked');
    });
    document.querySelectorAll('.focus-helper-sidebar-blocked').forEach(el => {
      el.classList.remove('focus-helper-sidebar-blocked');
    });
  }
})();
