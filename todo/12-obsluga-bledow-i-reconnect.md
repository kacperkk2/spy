# 12 — Obsługa błędów i ponownego połączenia

**Zależy od:** 07–09. Kody błędów: `todo-backend/00-kontrakt-api.md` (`ErrorCode`).

## Zakres
- `NICK_TAKEN` (409): błąd przy polu nick („Ten nick jest już zajęty”).
- `ROOM_NOT_FOUND` (404) / `ROOM_CLOSED` (410): snackbar „Pokój nie istnieje lub został zamknięty”, `clearRoomSession`, `/`.
- `UNAUTHORIZED` (401) przy wejściu do pokoju z zapisaną sesją (np. serwer zrestartował się i stracił pamięć): wyczyścić sesję i pokazać formularz dołączenia z poprzednim nickiem.
- `NOT_ENOUGH_PLAYERS`, `INVALID_STATE`: snackbar, a potem `getState` w celu synchronizacji.
- SSE: przy utracie połączenia dyskretny wskaźnik „Łączenie…”. Po ponownym otwarciu (`onopen` po błędzie) zrobić `getState` + `getMe`, bo mogło umknąć `round-started`.
- Powrót karty do pierwszego planu (`visibilitychange`) na telefonie: to samo odświeżenie stanu (mobilne przeglądarki zrywają SSE w tle).
- Błąd sieci przy akcjach hosta: przycisk znów aktywny, komunikat.

## Weryfikacja
Wyłączyć backend w trakcie gry i włączyć z powrotem. Dołączyć z zajętym nickiem. Otworzyć link do nieistniejącego pokoju. Na telefonie zminimalizować przeglądarkę, host w tym czasie startuje rundę, po powrocie rola jest aktualna.
