// --------------------
// DOM ELEMENTS
// --------------------
const durationInput = document.getElementById("duration");
const blockedArea = document.getElementById("blockedSites");
const toggleBtn = document.getElementById("toggleFocusBtn");
const statusText = document.getElementById("statusText");
const timerText = document.getElementById("timerText");
const pointsSpan = document.getElementById("points");
const levelSpan = document.getElementById("level");
const progressBar = document.getElementById("progressBar");

// --------------------
// STATE
// --------------------
let timerInterval = null;
let sessionMinutes = 0;
let sessionEndTime = 0;

// --------------------
// LOAD STORED DATA
// --------------------
chrome.storage.sync.get(
  [
    "totalPoints",
    "level",
    "blockedSites",
    "isFocusOn",
    "focusEndTime",
    "sessionMinutes"
  ],
  (data) => {
    pointsSpan.textContent = data.totalPoints || 0;
    levelSpan.textContent = data.level || "Bronze";
    blockedArea.value = (data.blockedSites || []).join(", ");

    if (data.isFocusOn && data.focusEndTime > Date.now()) {
      sessionEndTime = data.focusEndTime;
      sessionMinutes =
        data.sessionMinutes || parseInt(durationInput.value, 10);
      startTimer();
    }
  }
);

// --------------------
// START / STOP BUTTON
// --------------------
toggleBtn.addEventListener("click", () => {
  chrome.storage.sync.get(["isFocusOn"], (data) => {
    data.isFocusOn ? stopFocus() : startFocus();
  });
});

// --------------------
// START FOCUS
// --------------------
function startFocus() {
  sessionMinutes = parseInt(durationInput.value, 10);
  sessionEndTime = Date.now() + sessionMinutes * 60000;

  const sites = blockedArea.value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  chrome.storage.sync.set(
    {
      isFocusOn: true,
      focusEndTime: sessionEndTime,
      sessionMinutes: sessionMinutes,
      blockedSites: sites
    },
    () => {
      startTimer();
    }
  );
}

// --------------------
// STOP FOCUS
// --------------------
function stopFocus() {
  clearInterval(timerInterval);

  timerText.textContent = "";
  statusText.textContent = "Status: Not focusing";
  toggleBtn.textContent = "Start Focus";
  progressBar.style.width = "0%";

  chrome.storage.sync.set({
    isFocusOn: false,
    focusEndTime: 0,
    sessionMinutes: 0
  });
}

// --------------------
// TIMER LOGIC
// --------------------
function startTimer() {
  toggleBtn.textContent = "Stop Focus";
  statusText.textContent = "Status: Focusing";

  clearInterval(timerInterval);

  timerInterval = setInterval(() => {
    const remaining = sessionEndTime - Date.now();
    const totalMs = sessionMinutes * 60000;

    if (remaining <= 0) {
      clearInterval(timerInterval);
      progressBar.style.width = "100%";
      statusText.textContent = "Updating History... ⏳";

      chrome.runtime.sendMessage(
        {
          action: "SESSION_COMPLETED",
          minutes: sessionMinutes
        },
        (res) => {
          statusText.textContent = "Focus session completed 🎉";

          if (res) {
            pointsSpan.textContent = res.totalPoints;
            levelSpan.textContent = res.level;
          }

          toggleBtn.textContent = "Start Focus";
          timerText.textContent = "";
        }
      );
      return;
    }

    // Progress bar
    const progress = Math.max(
      0,
      Math.min(100, ((totalMs - remaining) / totalMs) * 100)
    );
    progressBar.style.width = `${progress}%`;

    const mins = Math.floor(remaining / 60000);
    const secs = Math.floor((remaining % 60000) / 1000);
    timerText.textContent = `Time left: ${mins}m ${secs}s`;
  }, 1000);
}

// --------------------
// LIVE POINT UPDATE
// --------------------
chrome.runtime.onMessage.addListener((req) => {
  if (req.action === "POINTS_UPDATED") {
    pointsSpan.textContent = req.totalPoints;
    levelSpan.textContent = req.level;
  }
});

// --------------------
// THEME TOGGLE
// --------------------
document.getElementById("themeToggle").addEventListener("click", () => {
  document.body.classList.toggle("dark");
  document.body.classList.toggle("light");
});

// --------------------
// DASHBOARD
// --------------------
document.getElementById("openDashboard").addEventListener("click", () => {
  chrome.tabs.create({
    url: chrome.runtime.getURL("dashboard/dashboard.html")
  });
});
