# 06 — Stan pokoju i rola gracza

**Zależy od:** 04, 05. Kontrakt: `00-kontrakt-api.md`.

## Zakres
- `GET /api/rooms/{code}` → `RoomStateDto`. Nigdy nie zwraca hasła ani szpiegów.
- `GET /api/rooms/{code}/me` → `MyRoleDto`:
  - brak rundy albo gracz spoza `participantIds`: `participating=false`, `isSpy=false`, `phrase=null`, `category=null`, `isStarting=false`;
  - szpieg: `isSpy=true`, `phrase=null`;
  - `category` tylko gdy `showCategory=true`;
  - `isStarting = (startingPlayerId == player.id)`.
  - W statusie REVEALED zwraca rolę z ostatniej rundy (front i tak pokazuje wtedy reveal).

## Kryteria akceptacji
- Testy: szpieg nie dostaje hasła, gracz dołączony w trakcie ma `participating=false`, przy `showCategory=false` `category` jest null.
