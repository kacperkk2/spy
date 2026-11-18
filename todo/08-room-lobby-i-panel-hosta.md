# 08 — RoomComponent: lobby i panel hosta

**Zależy od:** 03, 05, 07. Kontrakt: `todo-backend/00-kontrakt-api.md`.

## Zakres
- Subskrypcja `events(code, token)` (task 05). Stan pokoju (`RoomStateDto`) aktualizowany z `room-state` i `round-started`.
- Widoczne dla wszystkich: kod pokoju, przycisk „Kopiuj link” (`location.origin + CONFIG.URL_ROOT + '/room/' + code`, `cdkCopyToClipboard` + snackbar jak w `src/app/export-dialog/export-dialog.ts`), lista nicków (host oznaczony), numer rundy.
- Panel hosta (`isHost` z listy graczy po `playerId` z sesji):
  - formularz ustawień rundy przeniesiony z `StartComponent` bez pól „Liczba graczy”, „Liczba rund” i „Graj na jednym urządzeniu”: kategorie, losowa kategoria, liczba szpiegów, losowa liczba, szansa %, pokazuj kategorię. Zapamiętywany przez `StorageManagerService.saveForm` i walidowany jak w tasku 02 (szpiedzy ≤ liczba graczy w lobby);
  - „Nowa runda” (aktywne w LOBBY lub REVEALED przy ≥3 graczach): `draw(players.map(p => p.id), opts)` z taska 03, potem `startRound`;
  - „Zakończ rundę” (w IN_ROUND): `reveal`;
  - „Zamknij pokój” z potwierdzeniem: `closeRoom`, `clearRoomSession`, powrót na `/`.
- Formularz ustawień można schować w rozwijanej sekcji (`mat-expansion-panel` wymaga dodania `MatExpansionModule`) albo w dialogu, żeby nie zasłaniał roli hosta w trakcie gry.

## Weryfikacja
3 okna: host widzi dołączających na żywo, „Nowa runda” jest nieaktywne przy 2 graczach, start przy 3 zwiększa numer rundy u wszystkich.
