# TabGhost Architecture Draft

## Core concept

A single browser shell contains many isolated sub-profiles, each treated as a workspace for agents and automations.

## High-level layers

### 1. Browser shell

Responsible for launching tabs, windows, storage partitions, proxy bindings, and rendering.

### 2. Session manager

Owns creation, cloning, reset, snapshot, and replay of sub-profiles.

### 3. Identity layer

Defines fingerprint presets, browser metadata, storage policy, locale, timezone, and device profiles.

### 4. Automation layer

Exposes APIs for agents to spawn sessions, navigate, fill forms, and capture state.

### 5. Control panel

Human-facing dashboard for managing sub-profiles, tasks, logs, and sessions.

## Preferred implementation direction

Start with a controlled Chromium shell and session orchestration layer, then add a dashboard and automation API.

## Non-goals

- Anti-detect marketing
- Black-box spoofing claims
- Perpetual stealth framing

## Open questions

- Exact storage partitioning strategy
- Proxy per session vs proxy per workspace group
- Session snapshot format
- Integration boundary between shell and control panel
