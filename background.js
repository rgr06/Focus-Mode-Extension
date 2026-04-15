// --------------------
// EXTENSION INSTALL
// --------------------
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({
    isFocusOn: false,
    focusEndTime: 0,
    sessionMinutes: 0,
    blockedSites: ["youtube.com", "instagram.com", "facebook.com"],
    totalPoints: 0,
    level: "Bronze",
    history: {}
  });
});

// --------------------
// LEVEL LOGIC
// --------------------
function getLevel(points) {
  if (points >= 1500) return "Platinum";
  if (points >= 600) return "Gold";
  if (points >= 200) return "Silver";
  return "Bronze";
}

// --------------------
// SAVE FOCUS HISTORY
// --------------------
function saveFocusHistory(minutes, callback) {
  const today = new Date().toLocaleDateString("en-CA");

  chrome.storage.sync.get(["history"], (data) => {
    const history = data.history || {};
    history[today] = (history[today] || 0) + minutes;

    chrome.storage.sync.set({ history }, () => {
      if (callback) callback();
    });
  });
}

// --------------------
// MESSAGE LISTENER
// --------------------
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {

  // ⭐ SESSION COMPLETED
  if (request.action === "SESSION_COMPLETED") {
    const minutes = Number(request.minutes) || 0;

    chrome.storage.sync.get(["totalPoints"], (data) => {
      const currentPoints = data.totalPoints || 0;
      const newPoints = currentPoints + minutes;
      const newLevel = getLevel(newPoints);

      saveFocusHistory(minutes, () => {
        chrome.storage.sync.set(
          {
            totalPoints: newPoints,
            level: newLevel,
            isFocusOn: false,
            focusEndTime: 0,
            sessionMinutes: 0
          },
          () => {
            sendResponse({
              totalPoints: newPoints,
              level: newLevel
            });
          }
        );
      });
    });

    return true; // keep sendResponse alive
  }

  // ❌ PENALTY FOR BLOCKED SITE VISIT
  if (request.action === "BLOCKED_SITE_VISITED") {
    chrome.storage.sync.get(["totalPoints"], (data) => {
      const currentPoints = data.totalPoints || 0;
      const newPoints = Math.max(0, currentPoints - 2);
      const newLevel = getLevel(newPoints);

      chrome.storage.sync.set(
        {
          totalPoints: newPoints,
          level: newLevel
        },
        () => {
          chrome.runtime.sendMessage({
            action: "POINTS_UPDATED",
            totalPoints: newPoints,
            level: newLevel
          }).catch(() => {});
        }
      );
    });
  }
});
