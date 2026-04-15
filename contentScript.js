function getDomain(url) {
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return "";
  }
}

function showBlockedScreen() {
  document.documentElement.innerHTML = `
    <body style="
      background:#101820;
      color:#f2f2f2;
      font-family:system-ui,sans-serif;
      display:flex;
      align-items:center;
      justify-content:center;
      height:100vh;
      text-align:center;">
      <div>
        <h1>Stay Focused 🔒</h1>
        <p>This website is blocked during Focus Mode.</p>
        <p><strong>−2 points</strong> penalty applied.</p>
        <button onclick="history.back()">Go Back</button>
      </div>
    </body>
  `;
}

chrome.storage.sync.get(
  ["isFocusOn", "focusEndTime", "blockedSites"],
  (data) => {
    if (!data.isFocusOn || Date.now() > data.focusEndTime) return;

    const domain = getDomain(location.href);
    const blocked = (data.blockedSites || []).some(site =>
      domain.includes(site)
    );

    if (blocked) {
      chrome.runtime.sendMessage({ action: "BLOCKED_SITE_VISITED" });
      chrome.runtime.sendMessage({ action: "PAUSE_TIMER" });
      showBlockedScreen();
    }
  }
);
