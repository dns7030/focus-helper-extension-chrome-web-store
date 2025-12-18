// Background service worker for domain blocking

const BLOCKED_DOMAINS_KEY = 'blockedDomains';

// Initialize blocked domains list
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.get([BLOCKED_DOMAINS_KEY], (result) => {
    if (!result[BLOCKED_DOMAINS_KEY]) {
      chrome.storage.sync.set({ [BLOCKED_DOMAINS_KEY]: [] });
    }
  });
});

// Listen for storage changes and update blocking rules
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (changes[BLOCKED_DOMAINS_KEY]) {
    chrome.storage.sync.get(['masterEnabled'], (result) => {
      const masterEnabled = result.masterEnabled !== false;
      if (masterEnabled) {
        updateBlockingRules(changes[BLOCKED_DOMAINS_KEY].newValue || []);
      }
    });
  }
  
  // When master toggle changes, update rules accordingly
  if (changes.masterEnabled) {
    chrome.storage.sync.get([BLOCKED_DOMAINS_KEY], (result) => {
      const domains = result[BLOCKED_DOMAINS_KEY] || [];
      if (changes.masterEnabled.newValue) {
        // Re-enable blocking
        updateBlockingRules(domains);
      } else {
        // Disable blocking by removing all rules
        updateBlockingRules([]);
      }
    });
  }
});

// Update declarativeNetRequest rules based on blocked domains
async function updateBlockingRules(blockedDomains) {
  // Remove all existing dynamic rules
  const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
  const existingRuleIds = existingRules.map(rule => rule.id);
  
  if (existingRuleIds.length > 0) {
    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: existingRuleIds
    });
  }

  // Add new rules for blocked domains
  if (blockedDomains.length === 0) return;

  const newRules = [];
  blockedDomains.forEach((domain, index) => {
    const baseId = (index * 2) + 1;
    const redirectUrl = 'https://www.google.com';
    
    // Rule 1: Match with subdomain (*.domain.com)
    newRules.push({
      id: baseId,
      priority: 1,
      action: {
        type: 'redirect',
        redirect: { url: redirectUrl }
      },
      condition: {
        urlFilter: `*://*.${domain}/*`,
        resourceTypes: ['main_frame']
      }
    });
    
    // Rule 2: Match without subdomain (domain.com)
    newRules.push({
      id: baseId + 1,
      priority: 1,
      action: {
        type: 'redirect',
        redirect: { url: redirectUrl }
      },
      condition: {
        urlFilter: `*://${domain}/*`,
        resourceTypes: ['main_frame']
      }
    });
  });

  await chrome.declarativeNetRequest.updateDynamicRules({
    addRules: newRules
  });
}

// Initialize rules on startup
chrome.storage.sync.get(['masterEnabled', BLOCKED_DOMAINS_KEY], (result) => {
  const masterEnabled = result.masterEnabled !== false;
  const domains = result[BLOCKED_DOMAINS_KEY] || [];
  
  // Only apply rules if master toggle is enabled
  if (masterEnabled) {
    updateBlockingRules(domains);
  } else {
    updateBlockingRules([]);
  }
});

// Handle messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getBlockedDomains') {
    chrome.storage.sync.get([BLOCKED_DOMAINS_KEY], (result) => {
      sendResponse({ domains: result[BLOCKED_DOMAINS_KEY] || [] });
    });
    return true;
  }
  
  if (request.action === 'addBlockedDomain') {
    chrome.storage.sync.get([BLOCKED_DOMAINS_KEY], (result) => {
      const domains = result[BLOCKED_DOMAINS_KEY] || [];
      if (!domains.includes(request.domain)) {
        domains.push(request.domain);
        chrome.storage.sync.set({ [BLOCKED_DOMAINS_KEY]: domains }, () => {
          sendResponse({ success: true });
        });
      } else {
        sendResponse({ success: false, error: 'Domain already blocked' });
      }
    });
    return true;
  }
  
  if (request.action === 'removeBlockedDomain') {
    chrome.storage.sync.get([BLOCKED_DOMAINS_KEY], (result) => {
      const domains = result[BLOCKED_DOMAINS_KEY] || [];
      const filtered = domains.filter(d => d !== request.domain);
      chrome.storage.sync.set({ [BLOCKED_DOMAINS_KEY]: filtered }, () => {
        sendResponse({ success: true });
      });
    });
    return true;
  }
});
