// Twitter/X "For You" Tab Blocker
(function() {
  'use strict';

  let isEnabled = true;

  // Load settings from storage
  chrome.storage.sync.get(['twitterEnabled'], function(result) {
    isEnabled = result.twitterEnabled !== false;
    if (isEnabled) {
      blockForYouTab();
    }
  });

  // Listen for settings changes
  chrome.storage.onChanged.addListener(function(changes, namespace) {
    if (changes.twitterEnabled) {
      isEnabled = changes.twitterEnabled.newValue;
      if (isEnabled) {
        blockForYouTab();
      } else {
        unblockForYouTab();
      }
    }
  });

  function blockForYouTab() {
    addBlockingStyles();

    // Use MutationObserver to handle dynamic content
    const observer = new MutationObserver(function(mutations) {
      if (isEnabled) {
        hideForYouTab();
        switchToFollowingTab();
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

    // Initial execution
    hideForYouTab();
    switchToFollowingTab();
  }

  function hideForYouTab() {
    // Hide "For You" tab button
    const tabs = document.querySelectorAll('[role="tab"]');
    tabs.forEach(tab => {
      const text = tab.textContent.toLowerCase();
      if (text.includes('for you') || text.includes('foryou')) {
        if (!tab.classList.contains('focus-helper-blocked')) {
          tab.classList.add('focus-helper-blocked');
        }
      }
    });
  }

  function switchToFollowingTab() {
    // Only act on /home page
    const currentPath = window.location.pathname;
    if (currentPath !== '/home' && currentPath !== '/') {
      return;
    }

    // Find and click the "Following" tab if we're not already on it
    const tabs = document.querySelectorAll('[role="tab"]');
    let followingTab = null;
    let followingTabActive = false;

    tabs.forEach(tab => {
      const text = tab.textContent.toLowerCase();
      if (text.includes('following')) {
        followingTab = tab;
        // Check if Following tab is already active
        if (tab.getAttribute('aria-selected') === 'true') {
          followingTabActive = true;
        }
      }
    });

    // Click Following tab if it exists and isn't already active
    if (followingTab && !followingTabActive && !followingTab.classList.contains('focus-helper-clicked')) {
      followingTab.classList.add('focus-helper-clicked');
      followingTab.click();
      
      // Remove the marker after a delay
      setTimeout(() => {
        followingTab.classList.remove('focus-helper-clicked');
      }, 1000);
    }
  }

  function addBlockingStyles() {
    if (document.querySelector('#focus-helper-twitter-styles')) return;

    const style = document.createElement('style');
    style.id = 'focus-helper-twitter-styles';
    style.textContent = `
      .focus-helper-blocked {
        display: none !important;
      }
      
      .focus-helper-twitter-message {
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
      
      .focus-helper-button {
        display: inline-block;
        margin-top: 20px;
        padding: 12px 24px;
        background: white;
        color: #667eea;
        text-decoration: none;
        border-radius: 8px;
        font-weight: 600;
        font-size: 16px;
        transition: transform 0.2s, box-shadow 0.2s;
      }
      
      .focus-helper-button:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
      }
    `;
    document.head.appendChild(style);
  }

  function unblockForYouTab() {
    // Remove blocking styles
    const style = document.querySelector('#focus-helper-twitter-styles');
    if (style) style.remove();

    // Remove blocked class
    document.querySelectorAll('.focus-helper-blocked').forEach(el => {
      el.classList.remove('focus-helper-blocked');
    });

    // Remove message
    const message = document.querySelector('.focus-helper-twitter-message');
    if (message) message.remove();
  }
})();
