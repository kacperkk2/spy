# 08 — Strumień zdarzeń SSE

**Zależy od:** 05 (tokeny i autoryzacja). Kontrakt: `00-kontrakt-api.md` (sekcja Zdarzenia SSE).

## Zakres
- `GET /api/rooms/{code}/events?token=` → `SseEmitter` (timeout np. 30 min; front łączy się ponownie sam).
- Rejestr emiterów per pokój (`ConcurrentHashMap<code, CopyOnWriteArrayList<SseEmitter>>`). Usuwanie przy `onCompletion`, `onTimeout`, `onError` i przy `IOException` podczas wysyłki.
- Zaraz po podłączeniu wysłać `room-state` z aktualnym stanem.
- `RoomEvents.broadcast(code, name, data)`, używane przez join (`room-state`), start (`round-started`), reveal (`round-revealed`), delete i wygaśnięcie (`room-closed`, potem `complete()`).
- Heartbeat `@Scheduled` co 25 s: `SseEmitter.event().comment("ping")` do wszystkich.
- Upewnić się, że proxy/serwer nie buforuje (`Cache-Control: no-cache`, `X-Accel-Buffering: no`).

## Kryteria akceptacji
- `curl -N "localhost:<port>/api/rooms/ABCDE/events?token=..."` od razu dostaje `room-state`. Dołączenie gracza w drugim terminalu daje kolejne `room-state`. DELETE daje `room-closed` i koniec strumienia.
