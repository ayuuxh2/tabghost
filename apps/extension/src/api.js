// Thin client for the local TabGhost API. Base URL + optional bearer token
// live in chrome.storage.local, editable on the options page.

const DEFAULTS = { baseUrl: "http://127.0.0.1:8787", token: "" };

export async function getConfig() {
  const v = await chrome.storage.local.get(DEFAULTS);
  return { baseUrl: v.baseUrl || DEFAULTS.baseUrl, token: v.token || "" };
}

export async function setConfig(cfg) {
  await chrome.storage.local.set(cfg);
}

async function req(path, opts = {}) {
  const { baseUrl, token } = await getConfig();
  const headers = { "content-type": "application/json", ...(opts.headers || {}) };
  if (token) headers["authorization"] = `Bearer ${token}`;
  const res = await fetch(`${baseUrl}${path}`, { ...opts, headers });
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

export const api = {
  health: () => req("/health"),
  identities: () => req("/identities"),
  profiles: () => req("/profiles"),
  createProfile: (body) => req("/profiles", { method: "POST", body: JSON.stringify(body) }),
  cloneProfile: (id, label) =>
    req(`/profiles/${id}/clone`, { method: "POST", body: JSON.stringify({ label }) }),
  deleteProfile: (id) => req(`/profiles/${id}`, { method: "DELETE" }),
  sessions: () => req("/sessions"),
  spawn: (body) => req("/sessions", { method: "POST", body: JSON.stringify(body) }),
  closeSession: (id) => req(`/sessions/${id}`, { method: "DELETE" }),
  action: (id, body) =>
    req(`/sessions/${id}/actions`, { method: "POST", body: JSON.stringify(body) }),
};
