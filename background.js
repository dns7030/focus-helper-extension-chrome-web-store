// Background service worker for domain blocking

const BLOCKED_DOMAINS_KEY = 'blockedDomains';
const WHITELISTED_SUBDOMAINS_KEY = 'whitelistedSubdomains';

// Initialize blocked domains and whitelist
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.get([BLOCKED_DOMAINS_KEY, WHITELISTED_SUBDOMAINS_KEY], (result) => {
    if (!result[BLOCKED_DOMAINS_KEY]) {
      chrome.storage.sync.set({ [BLOCKED_DOMAINS_KEY]: [] });
    }
    if (!result[WHITELISTED_SUBDOMAINS_KEY]) {
      chrome.storage.sync.set({ [WHITELISTED_SUBDOMAINS_KEY]: {} });
    }
  });
});

// Listen for storage changes and update blocking rules
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (changes[BLOCKED_DOMAINS_KEY] || changes[WHITELISTED_SUBDOMAINS_KEY]) {
    chrome.storage.sync.get(['masterEnabled', BLOCKED_DOMAINS_KEY, WHITELISTED_SUBDOMAINS_KEY], (result) => {
      const masterEnabled = result.masterEnabled !== false;
      if (masterEnabled) {
        updateBlockingRules(result[BLOCKED_DOMAINS_KEY] || [], result[WHITELISTED_SUBDOMAINS_KEY] || {});
      }
    });
  }

  // When master toggle changes, update rules accordingly
  if (changes.masterEnabled) {
    chrome.storage.sync.get([BLOCKED_DOMAINS_KEY, WHITELISTED_SUBDOMAINS_KEY], (result) => {
      const domains = result[BLOCKED_DOMAINS_KEY] || [];
      const whitelist = result[WHITELISTED_SUBDOMAINS_KEY] || {};
      if (changes.masterEnabled.newValue) {
        // Re-enable blocking
        updateBlockingRules(domains, whitelist);
      } else {
        // Disable blocking by removing all rules
        updateBlockingRules([], {});
      }
    });
  }
});

// Update declarativeNetRequest rules based on blocked domains and whitelist
async function updateBlockingRules(blockedDomains, whitelistedSubdomains = {}) {
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
  let ruleId = 1;

  blockedDomains.forEach((domain) => {
    const redirectUrl = 'https://www.google.com';
    const whitelist = whitelistedSubdomains[domain] || [];

    // Rule for subdomains: only if there are whitelisted exceptions, use regex; otherwise use wildcard
    if (whitelist.length > 0) {
      // Create regex that blocks *.domain but NOT the whitelisted subdomains
      const escapedDomain = domain.replace(/\./g, '\\.');
      const negativeAssertions = whitelist.map(sub => `(?!${sub}\.${escapedDomain})`).join('');
      const regexPattern = `^https?://${negativeAssertions}[^/]*\.${escapedDomain}/`;

      newRules.push({
        id: ruleId++,
        priority: 2,
        action: {
          type: 'redirect',
          redirect: { url: redirectUrl }
        },
        condition: {
          regexFilter: regexPattern,
          resourceTypes: ['main_frame']
        }
      });
    } else {
      // No exceptions - use simple wildcard
      newRules.push({
        id: ruleId++,
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
    }

    // Rule for domain without subdomain
    newRules.push({
      id: ruleId++,
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
chrome.storage.sync.get(['masterEnabled', BLOCKED_DOMAINS_KEY, WHITELISTED_SUBDOMAINS_KEY], (result) => {
  const masterEnabled = result.masterEnabled !== false;
  const domains = result[BLOCKED_DOMAINS_KEY] || [];
  const whitelist = result[WHITELISTED_SUBDOMAINS_KEY] || {};

  // Only apply rules if master toggle is enabled
  if (masterEnabled) {
    updateBlockingRules(domains, whitelist);
  } else {
    updateBlockingRules([], {});
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

  if (request.action === 'addWhitelistedSubdomain') {
    chrome.storage.sync.get([WHITELISTED_SUBDOMAINS_KEY], (result) => {
      const whitelist = result[WHITELISTED_SUBDOMAINS_KEY] || {};
      if (!whitelist[request.domain]) {
        whitelist[request.domain] = [];
      }
      if (!whitelist[request.domain].includes(request.subdomain)) {
        whitelist[request.domain].push(request.subdomain);
        chrome.storage.sync.set({ [WHITELISTED_SUBDOMAINS_KEY]: whitelist }, () => {
          sendResponse({ success: true });
        });
      } else {
        sendResponse({ success: false, error: 'Subdomain already whitelisted' });
      }
    });
    return true;
  }

  if (request.action === 'removeWhitelistedSubdomain') {
    chrome.storage.sync.get([WHITELISTED_SUBDOMAINS_KEY], (result) => {
      const whitelist = result[WHITELISTED_SUBDOMAINS_KEY] || {};
      if (whitelist[request.domain]) {
        whitelist[request.domain] = whitelist[request.domain].filter(sub => sub !== request.subdomain);
        if (whitelist[request.domain].length === 0) {
          delete whitelist[request.domain];
        }
        chrome.storage.sync.set({ [WHITELISTED_SUBDOMAINS_KEY]: whitelist }, () => {
          sendResponse({ success: true });
        });
      } else {
        sendResponse({ success: false, error: 'Subdomain not found' });
      }
    });
    return true;
  }

  if (request.action === 'getWhitelistedSubdomains') {
    chrome.storage.sync.get([WHITELISTED_SUBDOMAINS_KEY], (result) => {
      sendResponse({ subdomains: result[WHITELISTED_SUBDOMAINS_KEY] || {} });
    });
    return true;
  }
});
