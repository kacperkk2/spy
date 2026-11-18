# 07 — Rundy, reveal i zamknięcie pokoju

**Zależy od:** 06. Kontrakt: `00-kontrakt-api.md` (endpointy + przejścia stanów). Broadcasty SSE realizuje task 08. Tutaj tylko publikować zdarzenia aplikacyjne (ten sam hak co w 04).

## Zakres
- `POST /api/rooms/{code}/rounds` (host), body `StartRoundRequest`:
  - dozwolone tylko w `LOBBY` lub `REVEALED`, inaczej 409 `INVALID_STATE`;
  - przy mniej niż 2 graczach w pokoju 409 `NOT_ENOUGH_PLAYERS`;
  - `spyPlayerIds` i `startingPlayerId` muszą należeć do pokoju, inaczej 400 `VALIDATION`. Pusta lista szpiegów jest OK;
  - `roundNumber++`, `participantIds` = aktualni gracze, status `IN_ROUND`;
  - broadcast `round-started` z `RoomStateDto`.
- `POST /api/rooms/{code}/rounds/current/reveal` (host): `IN_ROUND` → `REVEALED`, zwraca `RevealDto` i robi broadcast `round-revealed`.
- `GET /api/rooms/{code}/reveal`: zwraca `RevealDto` tylko w `REVEALED`.
- `DELETE /api/rooms/{code}` (host): broadcast `room-closed`, zamknięcie emiterów, usunięcie pokoju → 204.

## Kryteria akceptacji
- Testy przejść stanów: podwójny start daje 409, reveal w LOBBY daje 409, start przy 2 graczach daje 409, obcy `playerId` daje 400, po DELETE `GET` daje 404.
