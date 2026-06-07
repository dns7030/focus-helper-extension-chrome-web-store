// Background service worker for domain blocking

const BLOCKED_DOMAINS_KEY = 'blockedDomains';
const WHITELISTED_SUBDOMAINS_KEY = 'whitelistedSubdomains';
const REDIRECT_URL_KEY = 'redirectUrl';
const DEFAULT_REDIRECT = 'https://www.google.com';

// Initialize blocked domains, whitelist, and redirect target
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.get([BLOCKED_DOMAINS_KEY, WHITELISTED_SUBDOMAINS_KEY, REDIRECT_URL_KEY], (result) => {
    if (!result[BLOCKED_DOMAINS_KEY]) {
      chrome.storage.sync.set({ [BLOCKED_DOMAINS_KEY]: [] });
    }
    if (!result[WHITELISTED_SUBDOMAINS_KEY]) {
      chrome.storage.sync.set({ [WHITELISTED_SUBDOMAINS_KEY]: {} });
    }
    if (!result[REDIRECT_URL_KEY]) {
      chrome.storage.sync.set({ [REDIRECT_URL_KEY]: DEFAULT_REDIRECT });
    }
  });
});

// Read all settings from storage and (re)apply the blocking rules.
function refreshRules() {
  chrome.storage.sync.get(
    ['domainsEnabled', BLOCKED_DOMAINS_KEY, WHITELISTED_SUBDOMAINS_KEY, REDIRECT_URL_KEY],
    (result) => {
      const domainsEnabled = result.domainsEnabled !== false;
      const whitelist = result[WHITELISTED_SUBDOMAINS_KEY] || {};
      const redirectUrl = result[REDIRECT_URL_KEY] || DEFAULT_REDIRECT;
      if (domainsEnabled) {
        updateBlockingRules(result[BLOCKED_DOMAINS_KEY] || [], whitelist, redirectUrl);
      } else {
        updateBlockingRules([], {}, redirectUrl);
      }
    }
  );
}

// Re-apply rules whenever any setting that affects them changes
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (
    changes[BLOCKED_DOMAINS_KEY] ||
    changes[WHITELISTED_SUBDOMAINS_KEY] ||
    changes[REDIRECT_URL_KEY] ||
    changes.domainsEnabled
  ) {
    refreshRules();
  }
});

// Update declarativeNetRequest rules based on blocked domains and whitelist
async function updateBlockingRules(blockedDomains, whitelistedSubdomains = {}, redirectUrl = DEFAULT_REDIRECT) {
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
    // Stored exceptions are bare subdomain labels (e.g. "music"); build full hosts.
    const whitelist = (whitelistedSubdomains[domain] || []).map(sub =>
      sub.endsWith(domain) ? sub : `${sub}.${domain}`
    );

    // requestDomains matches the domain AND all its subdomains (e.g. youtube.com,
    // www.youtube.com, m.youtube.com). excludedRequestDomains carves out the
    // whitelisted hosts and their subdomains. This is handled natively by
    // declarativeNetRequest — no regex (RE2 doesn't support lookaheads anyway).
    const condition = {
      requestDomains: [domain],
      resourceTypes: ['main_frame']
    };
    if (whitelist.length > 0) {
      condition.excludedRequestDomains = whitelist;
    }

    newRules.push({
      id: ruleId++,
      priority: 1,
      action: {
        type: 'redirect',
        redirect: { url: redirectUrl }
      },
      condition
    });
  });

  await chrome.declarativeNetRequest.updateDynamicRules({
    addRules: newRules
  });
}

// Initialize rules on startup
refreshRules();

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

  if (request.action === 'getRedirectUrl') {
    chrome.storage.sync.get([REDIRECT_URL_KEY], (result) => {
      sendResponse({ redirectUrl: result[REDIRECT_URL_KEY] || DEFAULT_REDIRECT });
    });
    return true;
  }

  if (request.action === 'setRedirectUrl') {
    let url = (request.redirectUrl || '').trim();
    if (!url) {
      url = DEFAULT_REDIRECT;
    } else if (!/^https?:\/\//i.test(url)) {
      url = 'https://' + url;
    }
    chrome.storage.sync.set({ [REDIRECT_URL_KEY]: url }, () => {
      sendResponse({ success: true, redirectUrl: url });
    });
    return true;
  }
});
