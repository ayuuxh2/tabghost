// TabGhost background service worker.
// Keeps a light connection-status badge and relays messages from the popup.

import { getConfig } from "./api.js";

async function checkHealth() {
  try {
    const { baseUrl, token } = await getConfig();
    const headers = {};
    if (token) headers["authorization"] = `Bearer ${token}`;
    const res = await fetch(`${baseUrl}/health`, { headers });
    return res.ok;
  } catch {
    return false;
  }
}

async function updateBadge() {
  const ok = await checkHealth();
  await chrome.action.setBadgeText({ text: ok ? "on" : "" });
  await chrome.action.setBadgeBackgroundColor({ color: ok ? "#22c55e" : "#ef4444" });
}

chrome.runtime.onInstalled.addListener(updateBadge);
chrome.runtime.onStartup.addListener(updateBadge);

// Periodic health check.
chrome.alarms?.create?.("tg-health", { periodInMinutes: 1 });
chrome.alarms?.onAlarm.addListener((a) => {
  if (a.name === "tg-health") updateBadge();
});

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type === "tg-refresh-badge") {
    updateBadge().then(() => sendResponse({ ok: true }));
    return true;
  }
});
