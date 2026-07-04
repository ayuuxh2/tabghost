import { api } from "./api.js";

const $ = (id) => document.getElementById(id);
const listEl = $("list");

async function refresh() {
  try {
    await api.health();
    setStatus(true);
  } catch {
    setStatus(false);
    listEl.innerHTML = `<li class="empty">Can't reach TabGhost.<br/>Start it with <code>tabghost serve</code>, then check Settings.</li>`;
    $("count").textContent = "—";
    return;
  }

  try {
    const [{ identities }, { profiles }, { sessions }] = await Promise.all([
      api.identities(),
      api.profiles(),
      api.sessions(),
    ]);

    const sel = $("identity");
    if (sel.options.length === 0) {
      for (const id of identities) {
        const o = document.createElement("option");
        o.value = id.id;
        o.textContent = id.label;
        sel.appendChild(o);
      }
    }

    const liveByProfile = new Map();
    for (const s of sessions) liveByProfile.set(s.subProfileId, s);

    $("count").textContent = `${profiles.length} profiles · ${sessions.length} live`;

    if (!profiles.length) {
      listEl.innerHTML = `<li class="empty">No sub-profiles yet. Create one above.</li>`;
      return;
    }

    listEl.innerHTML = "";
    for (const p of profiles) {
      const live = liveByProfile.get(p.id);
      const li = document.createElement("li");
      li.innerHTML = `
        <div class="t">${escapeHtml(p.label)}</div>
        <div class="s">${escapeHtml(p.workspace)} · ${escapeHtml(p.identityId)}${live ? " · ● live" : ""}</div>
        <div class="acts"></div>`;
      const acts = li.querySelector(".acts");

      if (live) {
        acts.appendChild(btn("Close", "ghost", () => api.closeSession(live.id).then(refresh)));
      } else {
        acts.appendChild(btn("Launch", "", () => api.spawn({ subProfileId: p.id }).then(refresh)));
      }
      acts.appendChild(btn("Clone", "ghost", () => api.cloneProfile(p.id).then(refresh)));
      acts.appendChild(
        btn("Delete", "ghost", () => {
          if (confirm(`Delete "${p.label}"? This wipes its isolated storage.`))
            api.deleteProfile(p.id).then(refresh);
        }),
      );
      listEl.appendChild(li);
    }
  } catch (e) {
    listEl.innerHTML = `<li class="empty">Error: ${escapeHtml(String(e.message || e))}</li>`;
  }
}

function btn(text, cls, onClick) {
  const b = document.createElement("button");
  b.textContent = text;
  if (cls) b.className = cls;
  b.addEventListener("click", onClick);
  return b;
}

function setStatus(on) {
  $("dot").classList.toggle("on", on);
  $("status").textContent = on ? "online" : "offline";
  chrome.runtime.sendMessage({ type: "tg-refresh-badge" });
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
  );
}

$("create").addEventListener("click", async () => {
  const label = $("label").value.trim();
  const identityId = $("identity").value;
  if (!label) return;
  try {
    await api.createProfile({ label, identityId });
    $("label").value = "";
    refresh();
  } catch (e) {
    alert(`Create failed: ${e.message || e}`);
  }
});

$("options").addEventListener("click", (e) => {
  e.preventDefault();
  chrome.runtime.openOptionsPage();
});

refresh();
