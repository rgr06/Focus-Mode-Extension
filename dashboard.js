// --------------------
// Voucher Data
// --------------------
const vouchers = [
  { id: 21, name: "Hand Cricket Game Unlock 🏏", cost: 70 },
  { id: 22, name: "Tic Tac Toe Challenge ❌⭕", cost: 60 },
  { id: 23, name: "Reaction Speed Mini-Game ⚡", cost: 30 },
  { id: 1, name: "₹50 Amazon Gift Card", cost: 50 },
  { id: 2, name: "₹100 Swiggy Coupon", cost: 100 },
  { id: 3, name: "Premium Wallpaper Pack", cost: 20 },
  { id: 4, name: "₹100 Epic Games Credit", cost: 120 },
  { id: 9, name: "1 Month Netflix Access", cost: 200 },
  { id: 10, name: "Spotify Premium (1 Month)", cost: 120 },
  { id: 11, name: "YouTube Premium (1 Month)", cost: 110 },
  { id: 12, name: "Zomato ₹75 Coupon", cost: 80 },
  { id: 17, name: "1 month Youtube Premium", cost: 75 }
];

// --------------------
// Level Logic
// --------------------
function updateLevel(points) {
  if (points < 50) return "Bronze";
  if (points < 150) return "Silver";
  return "Gold";
}

// --------------------
// Display Vouchers
// --------------------
function displayVouchers(points) {
  const list = document.getElementById("voucherList");
  list.innerHTML = "";

  vouchers.forEach(v => {
    const div = document.createElement("div");
    div.className = "voucher";

    div.innerHTML = `
      <span>${v.name} — ${v.cost} points</span>
      <button class="redeem-btn" data-id="${v.id}">Redeem</button>
    `;

    if (points < v.cost) {
      const btn = div.querySelector("button");
      btn.disabled = true;
      btn.style.opacity = "0.5";
      btn.style.cursor = "not-allowed";
    }

    list.appendChild(div);
  });

  document.querySelectorAll(".redeem-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      redeemVoucher(parseInt(btn.dataset.id), points);
    });
  });
}

// --------------------
// Redeem Voucher
// --------------------
function redeemVoucher(id, points) {
  const voucher = vouchers.find(v => v.id === id);
  if (!voucher || points < voucher.cost) return;

  const newPoints = points - voucher.cost;

  chrome.storage.sync.set({ totalPoints: newPoints }, () => {
    alert(`Voucher Redeemed: ${voucher.name}`);
    loadDashboard();
  });

  if (voucher.name.includes("Hand Cricket")) {
    chrome.tabs.create({
      url: chrome.runtime.getURL("dashboard/handcricket.html")
    });
  }

  if (voucher.name.includes("Tic Tac Toe")) {
    chrome.tabs.create({
      url: chrome.runtime.getURL("dashboard/tictactoe.html")
    });
  }

  if (voucher.name.includes("Reaction Speed")) {
    chrome.tabs.create({
      url: chrome.runtime.getURL("dashboard/reaction.html")
    });
  }
}

// --------------------
// Focus History Calendar
// --------------------
function renderHistory(history) {
  const calendar = document.getElementById("calendar");
  calendar.innerHTML = "";

  if (Object.keys(history).length === 0) {
    calendar.innerHTML = "<p style='opacity:0.7'>No focus sessions yet</p>";
    return;
  }

  Object.keys(history).forEach(date => {
    const div = document.createElement("div");
    div.className = "calendar-day";

    div.innerHTML = `
      <strong>${date}</strong>
      <span>${history[date]} minutes focused</span>
    `;

    calendar.appendChild(div);
  });
}

// --------------------
// Load Dashboard
// --------------------
function loadDashboard() {
  chrome.storage.sync.get(
    ["totalPoints", "streak", "history"],
    (data) => {
      const points = data.totalPoints || 0;
      const streak = data.streak || 0;
      const history = data.history || {};

      document.getElementById("points").textContent = points;
      document.getElementById("streak").textContent = streak;
      document.getElementById("level").textContent = updateLevel(points);

      displayVouchers(points);
      renderHistory(history);
    }
  );
}

// --------------------
// MENU LOGIC (FIXED)
// --------------------
document.querySelectorAll(".menu button").forEach(btn => {
  btn.addEventListener("click", () => {
    const target = btn.dataset.target;

    // Hide all sections
    document.querySelectorAll(".section").forEach(sec =>
      sec.classList.remove("active")
    );

    // Deactivate all buttons
    document.querySelectorAll(".menu button").forEach(b =>
      b.classList.remove("active")
    );

    // Activate selected
    document.getElementById(target).classList.add("active");
    btn.classList.add("active");

    // Re-render content when opened
    if (target === "rewards") {
      chrome.storage.sync.get(["totalPoints"], data =>
        displayVouchers(data.totalPoints || 0)
      );
    }

    if (target === "history") {
      chrome.storage.sync.get(["history"], data =>
        renderHistory(data.history || {})
      );
    }
  });
});

// --------------------
loadDashboard();
