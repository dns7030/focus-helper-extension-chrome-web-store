// Get domain from URL parameter
const urlParams = new URLSearchParams(window.location.search);
const blockedDomain = urlParams.get('domain');

// Display the blocked domain
if (blockedDomain) {
  document.getElementById('blockedDomain').textContent = blockedDomain;
}

// Go back button
document.getElementById('goBack').addEventListener('click', () => {
  window.history.back();
});

// Unblock button
document.getElementById('unblock').addEventListener('click', () => {
  if (!blockedDomain) return;

  chrome.runtime.sendMessage(
    { action: 'removeBlockedDomain', domain: blockedDomain },
    (response) => {
      const messageEl = document.getElementById('message');
      if (response.success) {
        messageEl.className = 'message success';
        messageEl.textContent = `${blockedDomain} has been unblocked! Redirecting...`;
        
        // Redirect to the unblocked site after a short delay
        setTimeout(() => {
          window.location.href = `https://${blockedDomain}`;
        }, 1500);
      } else {
        messageEl.className = 'message error';
        messageEl.textContent = 'Failed to unblock site. Please try again.';
      }
    }
  );
});
