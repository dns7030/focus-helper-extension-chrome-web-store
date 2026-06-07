document.addEventListener('DOMContentLoaded', function() {
  const version = chrome.runtime.getManifest().version;
  document.getElementById('appVersion').textContent = version;

  const masterToggle = document.getElementById('masterToggle');
  const linkedinToggle = document.getElementById('linkedinToggle');
  const twitterToggle = document.getElementById('twitterToggle');
  const youtubeToggle = document.getElementById('youtubeToggle');
  const status = document.getElementById('status');
  const domainInput = document.getElementById('domainInput');
  const addDomainBtn = document.getElementById('addDomain');
  const blockedList = document.getElementById('blockedList');
  const redirectInput = document.getElementById('redirectInput');

  // Load saved settings
  chrome.storage.sync.get(['domainsEnabled', 'linkedinEnabled', 'twitterEnabled', 'youtubeEnabled'], function(result) {
    masterToggle.checked = result.domainsEnabled !== false;
    linkedinToggle.checked = result.linkedinEnabled !== false;
    twitterToggle.checked = result.twitterEnabled !== false;
    youtubeToggle.checked = result.youtubeEnabled !== false;
  });

  // Load blocked domains and whitelist
  loadBlockedDomains();
  loadWhitelistedSubdomains();

  // Load redirect target
  chrome.runtime.sendMessage({ action: 'getRedirectUrl' }, function(response) {
    if (response && response.redirectUrl) {
      redirectInput.value = response.redirectUrl;
    }
  });

  // Save redirect target when the user finishes editing
  function saveRedirectUrl() {
    chrome.runtime.sendMessage(
      { action: 'setRedirectUrl', redirectUrl: redirectInput.value },
      function(response) {
        if (response && response.success) {
          redirectInput.value = response.redirectUrl;
          showStatus(`Redirecting blocked sites to ${response.redirectUrl}`);
        }
      }
    );
  }

  redirectInput.addEventListener('blur', saveRedirectUrl);
  redirectInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      redirectInput.blur();
    }
  });

  // Domain blocking toggle - controls only domain blocking
  masterToggle.addEventListener('change', function() {
    const enabled = masterToggle.checked;
    chrome.storage.sync.set({ domainsEnabled: enabled }, function() {
      showStatus(enabled ? 'Domain blocking enabled' : 'Domain blocking disabled');
    });
  });

  // Save LinkedIn setting
  linkedinToggle.addEventListener('change', function() {
    const enabled = linkedinToggle.checked;
    chrome.storage.sync.set({ linkedinEnabled: enabled }, function() {
      showStatus('Settings saved');
    });
  });

  // Save Twitter setting
  twitterToggle.addEventListener('change', function() {
    const enabled = twitterToggle.checked;
    chrome.storage.sync.set({ twitterEnabled: enabled }, function() {
      showStatus('Settings saved');
    });
  });

  // Save YouTube setting with work hours timer
  let youtubeCountdown = null;

  youtubeToggle.addEventListener('change', function() {
    const enabled = youtubeToggle.checked;

    // Check if it's work hours and user is trying to disable blocking (allow recommendations back)
    if (!enabled && isWorkHours()) {
      // Prevent immediate toggle
      youtubeToggle.checked = false;

      // Clear any existing countdown
      if (youtubeCountdown) {
        clearInterval(youtubeCountdown);
      }

      // Start 15 second countdown
      let secondsLeft = 15;
      showStatus(`Wait ${secondsLeft}s to enable during work hours...`, false);

      youtubeCountdown = setInterval(() => {
        secondsLeft--;
        if (secondsLeft > 0) {
          showStatus(`Wait ${secondsLeft}s to enable during work hours...`, false);
        } else {
          clearInterval(youtubeCountdown);
          youtubeCountdown = null;
          // Now enable it
          youtubeToggle.checked = true;
          chrome.storage.sync.set({ youtubeEnabled: true }, function() {
            showStatus('YouTube recommendations enabled');
          });
        }
      }, 1000);
    } else {
      // Outside work hours or disabling - work normally
      chrome.storage.sync.set({ youtubeEnabled: enabled }, function() {
        showStatus('Settings saved');
      });
    }
  });

  function isWorkHours() {
    const now = new Date();
    const day = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const hour = now.getHours(); // 0-23

    // Monday to Friday (1-5) and 9am to 6pm (9-17, since 18 is 6pm start)
    return day >= 1 && day <= 5 && hour >= 9 && hour < 18;
  }

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

  let whitelistData = {};
  const expandedDomains = new Set();

  function loadBlockedDomains() {
    chrome.runtime.sendMessage(
      { action: 'getBlockedDomains' },
      function(response) {
        const domains = response.domains || [];
        renderBlockedDomains(domains);
      }
    );
  }

  function loadWhitelistedSubdomains() {
    chrome.runtime.sendMessage(
      { action: 'getWhitelistedSubdomains' },
      function(response) {
        whitelistData = response.subdomains || {};
        // Re-render if domains are already loaded
        if (blockedList.innerHTML && blockedList.innerHTML !== '<div class="empty-state">No blocked domains yet</div>') {
          chrome.runtime.sendMessage(
            { action: 'getBlockedDomains' },
            function(response) {
              renderBlockedDomains(response.domains || []);
            }
          );
        }
      }
    );
  }

  function renderBlockedDomains(domains) {
    if (domains.length === 0) {
      blockedList.innerHTML = '<div class="empty-state">No blocked domains yet</div>';
      return;
    }

    blockedList.innerHTML = domains.map(domain => {
      const whitelistedSubs = whitelistData[domain] || [];
      const exceptionCount = whitelistedSubs.length;
      const isExpanded = expandedDomains.has(domain);

      return `
        <div class="blocked-item${isExpanded ? ' expanded' : ''}">
          <div class="domain-row">
            <button class="expand-toggle" data-domain="${domain}" title="Allowed subdomains" aria-expanded="${isExpanded}">
              <span class="chevron">${isExpanded ? '▾' : '▸'}</span>
              <span class="blocked-domain">${domain}</span>
              ${exceptionCount > 0 ? `<span class="exception-count">${exceptionCount} allowed</span>` : ''}
            </button>
            <button class="remove-domain" data-domain="${domain}">Remove</button>
          </div>
          ${isExpanded ? `
            <div class="exceptions-panel">
              ${exceptionCount > 0 ? `
                <div class="exceptions-list">
                  ${whitelistedSubs.map(sub => `
                    <div class="exception-item">
                      <span class="exception-subdomain">${sub}.${domain}</span>
                      <button class="remove-exception" data-domain="${domain}" data-subdomain="${sub}">×</button>
                    </div>
                  `).join('')}
                </div>
              ` : ''}
              <div class="add-exception-form">
                <input type="text" class="exception-input" placeholder="Allow subdomain (e.g., music)" data-domain="${domain}" />
                <button class="add-exception" data-domain="${domain}">Allow</button>
              </div>
            </div>
          ` : ''}
        </div>
      `;
    }).join('');

    // Toggle the exceptions panel open/closed
    blockedList.querySelectorAll('.expand-toggle').forEach(btn => {
      btn.addEventListener('click', function() {
        const domain = this.getAttribute('data-domain');
        if (expandedDomains.has(domain)) {
          expandedDomains.delete(domain);
        } else {
          expandedDomains.add(domain);
        }
        renderBlockedDomains(domains);
        // Focus the input when opening so the user can type right away
        if (expandedDomains.has(domain)) {
          const input = blockedList.querySelector(`.exception-input[data-domain="${domain}"]`);
          if (input) input.focus();
        }
      });
    });

    // Add event listeners to remove buttons
    blockedList.querySelectorAll('.remove-domain').forEach(btn => {
      btn.addEventListener('click', function() {
        const domain = this.getAttribute('data-domain');
        removeDomain(domain);
      });
    });

    // Add event listeners to add exception buttons
    blockedList.querySelectorAll('.add-exception').forEach(btn => {
      btn.addEventListener('click', function() {
        const domain = this.getAttribute('data-domain');
        const input = blockedList.querySelector(`.exception-input[data-domain="${domain}"]`);
        const subdomain = input.value.trim().toLowerCase();
        if (subdomain) {
          addException(domain, subdomain);
        } else {
          showStatus('Please enter a subdomain', true);
        }
      });
    });

    // Add event listeners to exception inputs for Enter key
    blockedList.querySelectorAll('.exception-input').forEach(input => {
      input.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
          const domain = this.getAttribute('data-domain');
          const subdomain = this.value.trim().toLowerCase();
          if (subdomain) {
            addException(domain, subdomain);
          }
        }
      });
    });

    // Add event listeners to remove exception buttons
    blockedList.querySelectorAll('.remove-exception').forEach(btn => {
      btn.addEventListener('click', function() {
        const domain = this.getAttribute('data-domain');
        const subdomain = this.getAttribute('data-subdomain');
        removeException(domain, subdomain);
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

  function addException(domain, subdomain) {
    chrome.runtime.sendMessage(
      { action: 'addWhitelistedSubdomain', domain: domain, subdomain: subdomain },
      function(response) {
        if (response.success) {
          loadWhitelistedSubdomains();
          showStatus(`Allowed ${subdomain}.${domain}`);
        } else {
          showStatus(response.error || 'Failed to add exception', true);
        }
      }
    );
  }

  function removeException(domain, subdomain) {
    chrome.runtime.sendMessage(
      { action: 'removeWhitelistedSubdomain', domain: domain, subdomain: subdomain },
      function(response) {
        if (response.success) {
          loadWhitelistedSubdomains();
          showStatus(`Blocked ${subdomain}.${domain}`);
        } else {
          showStatus('Failed to remove exception', true);
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
