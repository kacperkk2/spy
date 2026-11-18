# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

"Spy" — a browser party game (Spyfall-style) built with Angular 14 + Angular Material + `@angular/flex-layout`. All UI text and game content is in **Polish**. Two modes:

- **Online (rooms)** — a host creates a room on the backend, players join by code or `/room/{code}` link with a nick, state is pushed via SSE.
- **Offline (one device)** — no backend; the whole round is encoded in the `game/<data>` URL and the device is passed around.

The backend (Spring, separate repo) is specified by the API contract in `todo-backend/00-kontrakt-api.md` — the single source of truth for models, endpoints, SSE events and error codes. Any contract change must land there.

## Commands

- `npm start` — dev server (`ng serve`, http://localhost:4200); online mode expects the API at `http://localhost:8080/api`
- `npm run build` — production build to `dist/spy`
- `npm test` — Karma/Jasmine tests (Chrome). Single spec: `npx ng test --include src/app/services/codec/codec.service.spec.ts`
- Spec files are mostly the default Angular CLI scaffolds.

## Deployment (GitHub Pages)

The committed `docs/` folder is the deployed site, served under `/spy/` (`docs/index.html` has `<base href="/spy/">`; `src/index.html` uses `/`). `docs/404.html` is a copy of `index.html` so deep links like `/spy/room/<code>` and `/spy/game/<data>` work on GitHub Pages. To redeploy:

```
npx ng build --output-path docs --base-href /spy/ && cp docs/index.html docs/404.html
```

Note `ng build --output-path docs` wipes the folder first, so `docs/icon.png` comes from the `src/icon.png` asset. `CONFIG.URL_ROOT` (`/spy`) in `app.properties.ts` must match the base href, since room share links are built from it.

**API URL** — `environment.apiUrl` (`src/environments/environment.ts` for dev, `environment.prod.ts` for prod, swapped by `fileReplacements`). Prod must be the public HTTPS URL of the API (different domain → backend needs CORS for the Pages origin).

Bundle budget in `angular.json` is raised (warning 900 kB) because the category content in `app.properties.ts` alone is large.

## Architecture

**Game data** — `src/app/app.properties.ts` holds the `CONFIG` object: localStorage keys, `URL_ROOT`, `MAX_SPIES_LIMIT`, and `CATEGORIES`. Each category is `{ name, values, questionsYesNo, questionsOpen }` (phrases, yes/no questions, open questions). The comment on each `name:` line records counts of phrases/questions — update it when adding content. Adding a new category here automatically makes it available in the settings forms and questions screen.

**Routes** (`app-routing.module.ts`):
- `''` Home — mode picker (no API calls): two tiles "Każdy na swoim telefonie" → `/online` and "Jeden telefon" → `/start`, "Twój nick: <nick> ✎" (`openNickDialog` helper in `nick-dialog.ts`), "return to room" if a session exists.
- `online` — `OnlineComponent`: create room / join by code (join just navigates to `/room/<code>`; a create without nick asks for it first), list of open rooms (`GET /api/rooms?limit=5`, refreshed every 10 s while visible; click → `/room/<code>`, more rooms → join by code). Leaving a room (back, closed, not found) returns here.
- `room/:code` — `RoomComponent`: join form (when no session for this code), lobby, role view, reveal, host panel.
- `start` → `game/:data` — offline one-device views laid out like the room (top bar, players card, action row; shared styles in `components/_offline-room.scss`, a copy — room styles stay separate): lobby (players list with −/+, 2–30, "Ustawienia gry") and game (player picker + role, reveal as players card with spies, "Nowa runda" re-draw; round number in `?r=` query param).
- `questions/:data?` — random yes/no or open question generator; `data` is a category name (ignored if not in `CONFIG.CATEGORIES`).

**Round drawing** — `services/round-draw/round-draw.service.ts` (`RoundDrawService.draw(playerIds, opts)`) picks phrase, category, spies and starting player; generic over id type (numbers offline, `playerId` strings online). `round-settings.form.ts` holds the shared settings controls/validators (`roundSettingsControls`, `bindRandomToggles`, `spiesNotMoreThanPlayers`, `toDrawOptions`). Random spies: exactly 1 spy with `oneSpyChance`% probability; otherwise uniform among 0 or 2..`min(players, MAX_SPIES_LIMIT)` (0 spies is possible).

**Online mode** (`services/room-api/`):
- `RoomApiService` — REST client; errors mapped to `ApiError` (`code` = contract `ErrorCode` or `NETWORK`/`UNKNOWN`). `apiErrorMessage` in `room-api.utils.ts` gives Polish messages; the same file has room-code / nick validation.
- `PlayerTokenInterceptor` — adds `X-Player-Token` from the stored session to requests for that session's room only.
- `RoomEventsService.events(code, token)` — cold Observable over `EventSource` (token in `?token=` since EventSource can't send headers); `status$` exposes `connecting`/`open`/`closed`. EventSource gives no HTTP status, so on stream failure the cause is checked via REST (`getState`).
- Sessions (`{code, playerId, playerToken, nick}`) are stored **per room** in localStorage via `StorageManagerService` (`saveRoomSession`/`getRoomSession(code?)`/`clearRoomSession(code)`, last 10 kept) plus a "current" room for "return to room". Per-room storage matters because the backend has no "leave" — a player stays in a room, so without its token returning would fail with `NICK_TAKEN`. A created room's session has `isHost: true`; a player can own only one room — while it exists (checked via `getState` on Home), "Stwórz pokój" becomes "Twój pokój <code>" and leads to it (front-only rule, the server doesn't enforce it). The player nick (`getNick`/`saveNick`) is global and set once; `saveRoomSession` does not overwrite it (a substitute nick used on `NICK_TAKEN` stays room-only). `RoomComponent` without a session auto-joins with the stored nick (once per entry, `autoJoinTried`); without a nick or on `NICK_TAKEN` it shows the join form.
- The **host draws the round on their own device** (`RoundDrawService` over lobby player ids) and sends it in `startRound`; the server only stores it and gives each player their own role (`GET /me`). SSE events carry no secrets — after `round-started` the client fetches `/me`. Room settings live only on the host's front.
- `RoomComponent.applyState` is the single place that sets room state; it fetches the role/reveal when the round changes (deduped by round number). It re-syncs (`refresh`) after an SSE reconnect and on `visibilitychange` (mobile browsers drop SSE in background). `handleRoomError` centralizes 404/410 (leave to `/`) and 401 (drop session, re-join with the stored nick or show the join form).

**Offline mode** — `drawOfflineGame` (in `start.component.ts`, used by `StartComponent` and `GameComponent` "Nowa runda") builds a `Settings` object (interface in `start.component.ts`); `CodecService` serializes it as a `;`-delimited string (field order matters), then lz-string `compressToBase64` + `encodeURIComponent`. `GameComponent` decodes it and shows a player-number grid. Changing `Settings` requires updating both `compress` and `decompress` together. Phrases must not contain `;`. Player names (`names`, optional, entered in the `/start` lobby, stored in the form as `names`) are the last field (JSON) so they may contain `;`; links without it decode to `[]`. `playerLabel` gives the name or "Gracz N".

**Round settings (both modes)** — one shared `RoundSettingsDialog` (`components/round-settings-dialog/`; online the host's "Zamknij pokój" is a separate button next to it in the room) opened via ⚙; values persisted to localStorage (`CONFIG.FORM_KEY`, offline also stores `players`). `storedDrawOptions(storage, playersCount)` turns the stored form into `DrawOptions` (or `null` if invalid → toast + open dialog); `settingsSummary` gives the one-line summary shown in lobby/start. Default categories = all. `ConfirmDialog` is shared too (`components/confirm-dialog/`).
