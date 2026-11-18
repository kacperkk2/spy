# 09 — RoomComponent: widok roli gracza i reveal

**Zależy od:** 08. Kontrakt: `todo-backend/00-kontrakt-api.md` (`MyRoleDto`, `RevealDto`).

## Zakres
- Przy `round-started` (i przy wejściu, gdy status IN_ROUND): `getMe`, potem ukryć hasło (`isPhraseShowed=false`).
- Widok roli wzorowany na `src/app/components/game/game.component.html`:
  - „Pokaż hasło / Ukryj hasło”;
  - hasło albo „Szpieg”, kategoria tylko gdy `category != null`;
  - „Zaczynasz turę!”, gdy `isStarting`. Wszyscy widzą też „Zaczyna: {nick}” (z `startingPlayerId` i listy graczy);
  - `participating=false`: komunikat „Dołączyłeś w trakcie rundy — poczekaj na następną”.
- Status LOBBY: „Czekamy na start rundy…” (u hosta panel z taska 08).
- Przy `round-revealed` (i przy wejściu, gdy status REVEALED: `getReveal`): ekran wyniku z hasłem, kategorią i nickami szpiegów („Brak szpiegów!”, gdy lista pusta).
- Przy `room-closed`: `clearRoomSession`, snackbar „Pokój został zamknięty”, nawigacja `/`.
- Host widzi swoją rolę dokładnie tak samo jak inni. UI nie pokazuje mu niczego więcej.

## Weryfikacja
3 okna, start rundy: szpieg widzi „Szpieg”, pozostali hasło, dokładnie jedna osoba ma „Zaczynasz turę!”. Czwarte okno dołącza w trakcie i widzi komunikat oczekiwania. Reveal pokazuje wszystkim wynik, a nowa runda obejmuje czwartego gracza.
