// LinkedIn Feed Blocker
(function() {
  'use strict';

  let isEnabled = true;
  let masterEnabled = true;

  // Load settings from storage
  chrome.storage.sync.get(['masterEnabled', 'linkedinEnabled'], function(result) {
    masterEnabled = result.masterEnabled !== false;
    isEnabled = result.linkedinEnabled !== false;
    if (isEnabled && masterEnabled) {
      blockFeed();
    }
  });

  // Listen for settings changes
  chrome.storage.onChanged.addListener(function(changes, namespace) {
    if (changes.masterEnabled) {
      masterEnabled = changes.masterEnabled.newValue;
      if (masterEnabled && isEnabled) {
        blockFeed();
      } else {
        unblockFeed();
      }
    }
    if (changes.linkedinEnabled) {
      isEnabled = changes.linkedinEnabled.newValue;
      if (isEnabled && masterEnabled) {
        blockFeed();
      } else {
        unblockFeed();
      }
    }
  });

  function blockFeed() {
    // Add CSS to hide the feed
    addBlockingStyles();
    
    // Use MutationObserver to handle dynamic content loading
    const observer = new MutationObserver(function(mutations) {
      if (isEnabled) {
        hideFeedElements();
      }
    });

    // Start observing
    if (document.body) {
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    } else {
      // Wait for body to be available
      document.addEventListener('DOMContentLoaded', function() {
        observer.observe(document.body, {
          childList: true,
          subtree: true
        });
      });
    }

    // Listen for URL changes (LinkedIn is a SPA)
    let lastUrl = location.href;
    new MutationObserver(() => {
      const currentUrl = location.href;
      if (currentUrl !== lastUrl) {
        lastUrl = currentUrl;
        // URL changed, re-check and apply blocking
        setTimeout(() => {
          hideFeedElements();
        }, 100);
      }
    }).observe(document, { subtree: true, childList: true });

    // Initial hide
    hideFeedElements();
  }

  function hideFeedElements() {
    // Check if blocking is enabled
    if (!isEnabled || !masterEnabled) {
      return;
    }
    
    // Only block on feed pages
    const currentPath = window.location.pathname;
    const isFeedPage = currentPath === '/feed/' || currentPath === '/feed' || currentPath === '/';
    
    if (!isFeedPage) {
      return; // Don't block on other pages like connections, messaging, etc.
    }

    // Hide main feed container
    const feedSelectors = [
      'main.scaffold-layout__main',
      '.feed-shared-update-v2',
      '.scaffold-finite-scroll',
      '[role="main"]',
      '.core-rail',
      'div.feed-shared-update-v2__description-wrapper'
    ];

    feedSelectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(el => {
        if (!el.classList.contains('focus-helper-blocked')) {
          el.classList.add('focus-helper-blocked');
        }
      });
    });

    // Show a message instead of the feed
    const main = document.querySelector('main.scaffold-layout__main');
    if (main && !document.querySelector('.focus-helper-message')) {
      const message = document.createElement('div');
      message.className = 'focus-helper-message';
      message.innerHTML = `
        <div class="focus-helper-content">
          <h2>🎯 Stay Focused</h2>
          <p>The LinkedIn feed is blocked to help you stay productive.</p>
          <p>Use the search, messages, or notifications to find what you need.</p>
        </div>
      `;
      main.parentNode.insertBefore(message, main);
    }
  }

  function addBlockingStyles() {
    if (document.querySelector('#focus-helper-linkedin-styles')) return;

    const style = document.createElement('style');
    style.id = 'focus-helper-linkedin-styles';
    style.textContent = `
      .focus-helper-blocked {
        display: none !important;
      }
      
      .focus-helper-message {
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

  function unblockFeed() {
    // Remove blocking styles
    const style = document.querySelector('#focus-helper-linkedin-styles');
    if (style) style.remove();

    // Remove blocked class
    document.querySelectorAll('.focus-helper-blocked').forEach(el => {
      el.classList.remove('focus-helper-blocked');
    });

    // Remove message
    const message = document.querySelector('.focus-helper-message');
    if (message) message.remove();
  }
})();
