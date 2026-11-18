# 09 — Wygasanie nieaktywnych pokoi

**Zależy od:** 07, 08.

## Zakres
- `@Scheduled` (np. co 10 min) usuwa pokoje z `lastActivityAt` starszym niż `app.room.ttl` (domyślnie 6 h).
- Przed usunięciem broadcast `room-closed` i zamknięcie emiterów.
- Aktywnością jest każde żądanie REST do pokoju. Heartbeat nie liczy się jako aktywność.

## Kryteria akceptacji
- Test z wstrzykniętym `Clock`: pokój starszy niż TTL zostaje usunięty, świeży zostaje.
