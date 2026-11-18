# 03 — Spójny format błędów

**Zależy od:** 01. Kontrakt: `00-kontrakt-api.md` (sekcja `ErrorDto`, kolumna „Błędy”).

## Zakres
- Wyjątki domenowe, np. `RoomNotFound`, `RoomClosed`, `NickTaken`, `Unauthorized`, `NotHost`, `InvalidState`, `NotEnoughPlayers`, `ValidationFailed`.
- `@RestControllerAdvice` mapuje je na status HTTP i `{ "error": "<KOD>", "message": "..." }` zgodnie z tabelą endpointów.
- Błędy Bean Validation (`MethodArgumentNotValidException`) dają 400 `VALIDATION`.

## Kryteria akceptacji
- Test MockMvc: nieistniejący pokój daje 404 z `{"error":"ROOM_NOT_FOUND"}`.
