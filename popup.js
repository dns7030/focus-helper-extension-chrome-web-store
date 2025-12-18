document.addEventListener('DOMContentLoaded', function() {
  const linkedinToggle = document.getElementById('linkedinToggle');
  const twitterToggle = document.getElementById('twitterToggle');
  const status = document.getElementById('status');

  // Load saved settings
  chrome.storage.sync.get(['linkedinEnabled', 'twitterEnabled'], function(result) {
    linkedinToggle.checked = result.linkedinEnabled !== false;
    twitterToggle.checked = result.twitterEnabled !== false;
  });

  // Save LinkedIn setting
  linkedinToggle.addEventListener('change', function() {
    const enabled = linkedinToggle.checked;
    chrome.storage.sync.set({ linkedinEnabled: enabled }, function() {
      showStatus();
      
      // Reload LinkedIn tabs
      chrome.tabs.query({ url: '*://*.linkedin.com/*' }, function(tabs) {
        tabs.forEach(tab => {
          chrome.tabs.reload(tab.id);
        });
      });
    });
  });

  // Save Twitter setting
  twitterToggle.addEventListener('change', function() {
    const enabled = twitterToggle.checked;
    chrome.storage.sync.set({ twitterEnabled: enabled }, function() {
      showStatus();
      
      // Reload Twitter/X tabs
      chrome.tabs.query({ url: ['*://*.twitter.com/*', '*://*.x.com/*'] }, function(tabs) {
        tabs.forEach(tab => {
          chrome.tabs.reload(tab.id);
        });
      });
    });
  });

  function showStatus() {
    status.classList.add('show');
    setTimeout(() => {
      status.classList.remove('show');
    }, 2000);
  }
});
