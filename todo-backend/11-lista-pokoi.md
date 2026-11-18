# 11 — Publiczna lista pokoi

**Zależy od:** 02, 04. Kontrakt: `00-kontrakt-api.md`.

## Zakres
- `GET /api/rooms?limit=3` → `RoomListDto`, bez autoryzacji (token ignorowany).
- `limit`: opcjonalny, 1–20, domyślnie 3; poza zakresem albo nie-liczba → 400 VALIDATION.
- Tylko pokoje otwarte (bez CLOSED / wygasłych), posortowane po `lastActivityAt` malejąco, obcięte do `limit`.
- `RoomSummaryDto`: `code`, `hostNick` (nick hosta), `playersCount`, `status`. Żadnych tokenów, id graczy ani danych rundy.
- `total` = liczba wszystkich otwartych pokoi (przed obcięciem).
- Odczyt nie aktualizuje `lastActivityAt` (lista nie może przedłużać życia pokoi).
- CORS jak dla pozostałych endpointów.

## Kryteria akceptacji
- Testy: przy 5 pokojach i `limit=3` wracają 3 ostatnio aktywne, `total=5`; zamknięty pokój nie występuje; `limit=0` i `limit=21` → 400; GET listy nie zmienia `lastActivityAt`.
