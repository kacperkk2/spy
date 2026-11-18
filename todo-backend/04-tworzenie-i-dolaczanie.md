# 04 — Tworzenie pokoju i dołączanie

**Zależy od:** 02, 03. Kontrakt: `00-kontrakt-api.md`.

## Zakres
- `POST /api/rooms` `{nick}` → 201 `{code, playerId, playerToken}`. Twórca zostaje hostem, status `LOBBY`, `roundNumber=0`.
- `POST /api/rooms/{code}/players` `{nick}` → 201 `{playerId, playerToken}`.
  - Walidacja nicku: trim, 1–20 znaków, unikalny w pokoju bez rozróżniania wielkości liter (409 `NICK_TAKEN`).
  - Dołączanie jest możliwe w każdym statusie poza CLOSED. Gracz dołączający w trakcie rundy nie trafia do `participantIds`.
  - Po dołączeniu broadcast SSE `room-state` (realizuje task 08; do tego czasu zostawić hak, np. `ApplicationEventPublisher` z `RoomChangedEvent`).
- Kod w ścieżce normalizowany do wielkich liter.

## Kryteria akceptacji
- Testy: tworzenie, dołączenie, duplikat nicku (`Ania` vs `ania`) daje 409, nieistniejący kod daje 404, pusty nick daje 400.
