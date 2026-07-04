import { getConfig, setConfig } from "./api.js";

const $ = (id) => document.getElementById(id);

async function load() {
  const cfg = await getConfig();
  $("baseUrl").value = cfg.baseUrl;
  $("token").value = cfg.token;
}

$("save").addEventListener("click", async () => {
  await setConfig({
    baseUrl: $("baseUrl").value.trim() || "http://127.0.0.1:8787",
    token: $("token").value.trim(),
  });
  const el = $("saved");
  el.textContent = "Saved ✓";
  setTimeout(() => (el.textContent = ""), 1500);
});

load();
