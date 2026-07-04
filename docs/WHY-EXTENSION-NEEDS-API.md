# Why the extension asks for an API URL

Short version: **the extension is a remote control, not the engine.** The real work
(isolated browsers, separate cookie jars, fingerprints, proxies) happens in the
TabGhost app running on your computer. The extension just talks to it.

---

## The two pieces

TabGhost has two parts:

1. **The engine (`tabghost serve`)** — a small program that runs on your machine.
   It launches real isolated Chromium sessions, one per sub-profile, each with its
   own storage and identity. It exposes a tiny local API at `http://127.0.0.1:8787`.

2. **The extension** — a button in your browser toolbar. When you click "spawn"
   or "clone", it sends that request to the engine's API. The engine does the work.

So the "API URL" the extension asks for is simply: **"where is the engine running?"**
By default that's `http://127.0.0.1:8787` (your own computer). You usually never
change it.

```
[ Extension popup ]  ---->  http://127.0.0.1:8787  ---->  [ TabGhost engine ]
   (the remote)                (the local API)               (real browsers)
```

---

## Why can't the extension just do it itself?

Because a Chrome extension **physically cannot** create truly isolated sub-profiles.
This is a hard limit of the browser, not a design choice:

- Extensions run *inside* one browser profile. They share that profile's cookies,
  storage, and fingerprint. An extension cannot give tab B a different cookie jar
  from tab A on the same site.
- Extensions cannot spoof the deep fingerprint surface (real WebGL driver strings,
  canvas, audio, hardware) before every page script runs. Sites see through it.
- Extensions cannot bind a different proxy per tab, or launch fresh OS-level browser
  instances.

Only a program running **outside** the browser (the engine) can launch separate
Chromium instances with separate `userDataDir`s. That's the whole reason TabGhost
is an engine + controller, instead of "just an extension." It's what makes the
isolation real instead of fake.

---

## What this means for you

- **Start the engine first** (`tabghost serve`, or `bun run api` from source).
  Then open the extension — it will connect and show green.
- If the extension says "disconnected", the engine isn't running (or is on a
  different port). Start it, or fix the URL in the extension's settings.
- The API URL stays `http://127.0.0.1:8787` for normal local use. You'd only change
  it if you run the engine on another machine or a custom port.
- If you set `TABGHOST_TOKEN` on the engine, paste the same token into the
  extension settings so it's allowed to connect.

---

## TL;DR

The extension asks for an API URL because it's a **remote control** for the TabGhost
engine. The engine is what actually creates the isolated browsers — and it has to be
a separate program, because no browser extension can do real per-tab isolation. Point
the extension at your local engine (`http://127.0.0.1:8787`), keep the engine running,
and you're set.
