# 05 — Strumień zdarzeń SSE

**Zależy od:** 04. Kontrakt: `todo-backend/00-kontrakt-api.md` (sekcja Zdarzenia SSE).

## Zmiana
- W `RoomApiService` (albo osobnym `RoomEventsService`) metoda `events(code, token): Observable<RoomEvent>`:
  - `new EventSource(`${apiUrl}/rooms/${code}/events?token=${encodeURIComponent(token)}`)`;
  - `addEventListener` dla `room-state`, `round-started`, `round-revealed`, `room-closed`, `JSON.parse(e.data)`;
  - emitowanie wewnątrz `NgZone.run` (EventSource działa poza strefą Angulara);
  - teardown `es.close()`; po `room-closed` zamknąć i zakończyć Observable.
- Typ `RoomEvent` jako unia dyskryminowana (`{type:'room-state', data: RoomStateDto} | ...`).
- `onerror`: EventSource łączy się ponownie sam. Wystawić `connected$`/status, żeby UI mógł pokazać „łączenie…”. Po ponownym połączeniu serwer i tak wysyła `room-state` (pełny stan), więc nie trzeba osobnej synchronizacji poza `getMe` (task 12).

## Weryfikacja
Z działającym backendem: zasubskrybować w konsoli lub komponencie testowym i dołączyć drugiego gracza przez `curl`. Przychodzi `room-state`.
