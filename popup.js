document.addEventListener('DOMContentLoaded', function() {
  const masterToggle = document.getElementById('masterToggle');
  const linkedinToggle = document.getElementById('linkedinToggle');
  const twitterToggle = document.getElementById('twitterToggle');
  const status = document.getElementById('status');
  const domainInput = document.getElementById('domainInput');
  const addDomainBtn = document.getElementById('addDomain');
  const blockedList = document.getElementById('blockedList');

  // Load saved settings
  chrome.storage.sync.get(['masterEnabled', 'linkedinEnabled', 'twitterEnabled'], function(result) {
    masterToggle.checked = result.masterEnabled !== false;
    linkedinToggle.checked = result.linkedinEnabled !== false;
    twitterToggle.checked = result.twitterEnabled !== false;
  });

  // Load blocked domains
  loadBlockedDomains();

  // Master toggle - controls all blocking
  masterToggle.addEventListener('change', function() {
    const enabled = masterToggle.checked;
    chrome.storage.sync.set({ masterEnabled: enabled }, function() {
      showStatus(enabled ? 'All blocking enabled' : 'All blocking disabled');
      
      // Reload all LinkedIn and Twitter tabs
      chrome.tabs.query({ url: ['*://*.linkedin.com/*', '*://*.twitter.com/*', '*://*.x.com/*'] }, function(tabs) {
        tabs.forEach(tab => {
          chrome.tabs.reload(tab.id);
        });
      });
    });
  });

  // Save LinkedIn setting
  linkedinToggle.addEventListener('change', function() {
    const enabled = linkedinToggle.checked;
    chrome.storage.sync.set({ linkedinEnabled: enabled }, function() {
      showStatus('Settings saved');
      
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
      showStatus('Settings saved');
      
      // Reload Twitter/X tabs
      chrome.tabs.query({ url: ['*://*.twitter.com/*', '*://*.x.com/*'] }, function(tabs) {
        tabs.forEach(tab => {
          chrome.tabs.reload(tab.id);
        });
      });
    });
  });

  // Add domain
  addDomainBtn.addEventListener('click', addDomain);
  domainInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      addDomain();
    }
  });

  function addDomain() {
    let domain = domainInput.value.trim().toLowerCase();
    
    if (!domain) {
      showStatus('Please enter a domain', true);
      return;
    }

    // Remove protocol if present
    domain = domain.replace(/^https?:\/\//, '');
    // Remove www. if present
    domain = domain.replace(/^www\./, '');
    // Remove trailing slash
    domain = domain.replace(/\/$/, '');
    // Remove path if present
    domain = domain.split('/')[0];

    // Basic domain validation
    if (!domain.includes('.') || domain.length < 3) {
      showStatus('Invalid domain format', true);
      return;
    }

    chrome.runtime.sendMessage(
      { action: 'addBlockedDomain', domain: domain },
      function(response) {
        if (response.success) {
          domainInput.value = '';
          loadBlockedDomains();
          showStatus(`Blocked ${domain}`);
        } else {
          showStatus(response.error || 'Failed to add domain', true);
        }
      }
    );
  }

  function loadBlockedDomains() {
    chrome.runtime.sendMessage(
      { action: 'getBlockedDomains' },
      function(response) {
        const domains = response.domains || [];
        renderBlockedDomains(domains);
      }
    );
  }

  function renderBlockedDomains(domains) {
    if (domains.length === 0) {
      blockedList.innerHTML = '<div class="empty-state">No blocked domains yet</div>';
      return;
    }

    blockedList.innerHTML = domains.map(domain => `
      <div class="blocked-item">
        <span class="blocked-domain">${domain}</span>
        <button class="remove-domain" data-domain="${domain}">Remove</button>
      </div>
    `).join('');

    // Add event listeners to remove buttons
    blockedList.querySelectorAll('.remove-domain').forEach(btn => {
      btn.addEventListener('click', function() {
        const domain = this.getAttribute('data-domain');
        removeDomain(domain);
      });
    });
  }

  function removeDomain(domain) {
    chrome.runtime.sendMessage(
      { action: 'removeBlockedDomain', domain: domain },
      function(response) {
        if (response.success) {
          loadBlockedDomains();
          showStatus(`Unblocked ${domain}`);
        } else {
          showStatus('Failed to remove domain', true);
        }
      }
    );
  }

  function showStatus(message, isError = false) {
    status.textContent = message;
    status.style.color = isError ? '#dc3545' : '#28a745';
    status.classList.add('show');
    setTimeout(() => {
      status.classList.remove('show');
    }, 2000);
  }
});
