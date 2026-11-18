# 01 — Ukrywanie hasła przy zmianie gracza (tryb jednego urządzenia)

**Niezależne od backendu.**

## Problem
W trybie jednego urządzenia (`settings.oneDevice`) `GameComponent` pokazuje siatkę numerów graczy. `setCurrentUser(player)` w `src/app/components/game/game.component.ts` zmienia tylko `userId`. Jeśli hasło jest odsłonięte (`isPhraseShowed=true`), kliknięcie innego numeru od razu pokazuje rolę tego gracza. Następny gracz widzi swoją rolę bez klikania „Pokaż hasło”, a ktoś ciekawski może podejrzeć cudzą.

## Zmiana
- W `setCurrentUser` ustawiać `this.isPhraseShowed = false`.
- Opcjonalnie: gdy hasło jest odsłonięte, przyciski numerów wyłączyć (`[disabled]="isPhraseShowed"`), żeby wymusić „Ukryj hasło” przed oddaniem urządzenia.

## Weryfikacja
`npm start`, utworzyć grę z „Graj na jednym urządzeniu”. Wybrać gracza 1, pokazać hasło, kliknąć gracza 2: hasło musi być ukryte.
