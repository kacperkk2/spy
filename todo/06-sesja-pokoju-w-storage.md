# 06 — Sesja pokoju w localStorage

**Niezależne od backendu.**

## Stan obecny
`src/app/services/storage-manager/storage-manager.service.ts` trzyma `user_id` (numer gracza dla trybu linków) i `form` (ostatnie ustawienia formularza start). Klucze są w `CONFIG` w `src/app/app.properties.ts`.

## Zmiana
- Nowy klucz `CONFIG.ROOM_SESSION_KEY = "room_session"` i metody `getRoomSession(): {code, playerId, playerToken, nick} | null`, `saveRoomSession(...)`, `clearRoomSession()`.
- Jedna aktywna sesja naraz. Dołączenie do innego pokoju nadpisuje poprzednią.
- Zapamiętać też ostatni nick (`CONFIG.NICK_KEY`), żeby wypełniać nim formularz dołączania.
- `user_id` i `getUserId/saveUserId` usunąć dopiero w tasku 10 (dziś używają ich `Home`, `User` i `Game`).
- Interceptor z taska 04 bierze token stąd.

## Weryfikacja
Spec serwisu: zapis, odczyt i czyszczenie sesji.
