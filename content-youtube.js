// YouTube Recommendations Blocker
(function() {
  'use strict';

  let isEnabled = true;
  let masterEnabled = true;

  // Load settings from storage
  chrome.storage.sync.get(['masterEnabled', 'youtubeEnabled'], function(result) {
    masterEnabled = result.masterEnabled !== false;
    isEnabled = result.youtubeEnabled !== false;
    if (isEnabled && masterEnabled) {
      blockRecommendations();
    }
  });

  // Listen for settings changes
  chrome.storage.onChanged.addListener(function(changes, namespace) {
    if (changes.masterEnabled) {
      masterEnabled = changes.masterEnabled.newValue;
      if (masterEnabled && isEnabled) {
        blockRecommendations();
      } else {
        unblockRecommendations();
      }
    }
    if (changes.youtubeEnabled) {
      isEnabled = changes.youtubeEnabled.newValue;
      if (isEnabled && masterEnabled) {
        blockRecommendations();
      } else {
        unblockRecommendations();
      }
    }
  });

  function blockRecommendations() {
    addBlockingStyles();

    // Use MutationObserver to handle dynamic content
    const observer = new MutationObserver(function(mutations) {
      if (isEnabled && masterEnabled) {
        hideRecommendations();
      }
    });

    if (document.body) {
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    } else {
      document.addEventListener('DOMContentLoaded', function() {
        observer.observe(document.body, {
          childList: true,
          subtree: true
        });
      });
    }

    // Listen for URL changes (YouTube is a SPA)
    let lastUrl = location.href;
    new MutationObserver(() => {
      const currentUrl = location.href;
      if (currentUrl !== lastUrl) {
        lastUrl = currentUrl;
        setTimeout(() => {
          hideRecommendations();
        }, 100);
      }
    }).observe(document, { subtree: true, childList: true });

    // Initial execution
    hideRecommendations();
  }

  function hideRecommendations() {
    // Check if blocking is enabled
    if (!isEnabled || !masterEnabled) {
      return;
    }

    const currentPath = window.location.pathname;
    const isHomePage = currentPath === '/' || currentPath === '';
    const isWatchPage = currentPath.startsWith('/watch');
    const isChannelPage = currentPath.startsWith('/@') || currentPath.startsWith('/channel/') || currentPath.startsWith('/c/');

    // Don't block anything on channel pages
    if (isChannelPage) {
      return;
    }

    // Block homepage feed
    if (isHomePage) {
      blockHomepageFeed();
    }

    // Block sidebar recommendations on watch pages
    if (isWatchPage) {
      blockWatchPageSidebar();
      blockEndScreens();
      blockComments();
    }

    // Block shorts
    if (currentPath.startsWith('/shorts')) {
      blockShorts();
    }
  }

  function blockHomepageFeed() {
    // Hide the main feed on homepage
    const feedSelectors = [
      'ytd-browse[page-subtype="home"]',
      'ytd-two-column-browse-results-renderer',
      '#contents.ytd-rich-grid-renderer',
      'ytd-rich-grid-renderer',
      'ytd-rich-item-renderer',
      'ytd-rich-section-renderer'
    ];

    feedSelectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(el => {
        if (!el.classList.contains('focus-helper-blocked')) {
          el.classList.add('focus-helper-blocked');
        }
      });
    });

    // No message - just leave the page empty
  }

  function blockWatchPageSidebar() {
    // Hide recommended videos sidebar on watch page (but allow playlists)
    const sidebarSelectors = [
      '#related',
      'ytd-compact-video-renderer',
      'ytd-compact-autoplay-renderer'
    ];

    sidebarSelectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(el => {
        if (!el.classList.contains('focus-helper-sidebar-blocked')) {
          el.classList.add('focus-helper-sidebar-blocked');
        }
      });
    });
    
    // Block specific items in secondary but not the whole container
    const secondaryItems = document.querySelectorAll('#secondary ytd-compact-video-renderer, #secondary ytd-compact-autoplay-renderer');
    secondaryItems.forEach(el => {
      if (!el.classList.contains('focus-helper-sidebar-blocked')) {
        el.classList.add('focus-helper-sidebar-blocked');
      }
    });
  }

  function blockEndScreens() {
    // Hide end screen video suggestions (but allow playlists)
    const endScreenSelectors = [
      '.ytp-ce-element:not(.ytp-ce-playlist)',
      '.ytp-endscreen-content',
      '.ytp-ce-covering-overlay',
      '.ytp-ce-element-show:not(.ytp-ce-playlist)',
      '.ytp-ce-video'
    ];

    endScreenSelectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(el => {
        if (!el.classList.contains('focus-helper-blocked')) {
          el.classList.add('focus-helper-blocked');
        }
      });
    });
  }

  function blockComments() {
    // Comments are now blocked via CSS for more reliable hiding
    // No need for JavaScript manipulation
  }

  function blockShorts() {
    // Block YouTube Shorts
    const shortsSelectors = [
      'ytd-reel-video-renderer',
      'ytd-shorts',
      '#shorts-container'
    ];

    shortsSelectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(el => {
        if (!el.classList.contains('focus-helper-blocked')) {
          el.classList.add('focus-helper-blocked');
        }
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
      
      .focus-helper-comments-blocked {
        display: none !important;
      }
      
      /* Block comments section with CSS - more reliable */
      ytd-comments#comments,
      #comments.ytd-watch-flexy,
      ytd-comments-header-renderer,
      ytd-comment-thread-renderer {
        display: none !important;
      }
      
      .focus-helper-youtube-message {
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 400px;
        padding: 40px 20px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        margin: 20px;
        border-radius: 12px;
      }
      
      .focus-helper-content {
        text-align: center;
        color: white;
        max-width: 500px;
      }
      
      .focus-helper-content h2 {
        font-size: 32px;
        margin-bottom: 16px;
        font-weight: 600;
      }
      
      .focus-helper-content p {
        font-size: 18px;
        line-height: 1.6;
        margin: 8px 0;
        opacity: 0.95;
      }
    `;
    document.head.appendChild(style);
  }

  function unblockRecommendations() {
    // Remove blocking styles
    const style = document.querySelector('#focus-helper-youtube-styles');
    if (style) style.remove();

    // Remove blocked classes
    document.querySelectorAll('.focus-helper-blocked').forEach(el => {
      el.classList.remove('focus-helper-blocked');
    });

    document.querySelectorAll('.focus-helper-sidebar-blocked').forEach(el => {
      el.classList.remove('focus-helper-sidebar-blocked');
    });

    document.querySelectorAll('.focus-helper-comments-blocked').forEach(el => {
      el.classList.remove('focus-helper-comments-blocked');
    });
  }
})();
