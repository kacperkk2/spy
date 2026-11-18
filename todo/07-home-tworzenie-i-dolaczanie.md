# 07 — Home: tworzenie i dołączanie do pokoju

**Zależy od:** 04, 06. Kontrakt: `todo-backend/00-kontrakt-api.md`.

## Stan obecny
`src/app/components/home/home.component.*` pokazuje „Gracz numer X / Zmień numer”, przycisk „Stwórz grę” (→ `/start`) i „?” (→ `/questions`). Bez numeru przekierowuje na `/user`.

## Zmiana
- Home bez numeru gracza i bez przekierowania na `/user`. Akcje:
  - „Stwórz pokój”: pole nick, potem `createRoom`, `saveRoomSession`, nawigacja `/room/{code}`;
  - „Dołącz”: pola kod + nick, nawigacja `/room/{code}` (samo dołączenie w RoomComponent albo tutaj);
  - „Jedno urządzenie”: `/start` (ustawienia offline);
  - „?”: `/questions` (bez zmian).
  - Jeśli w storage jest aktywna sesja, pokazać „Wróć do pokoju {code}”.
- Routing (`src/app/app-routing.module.ts`): dodać `room/:code` → `RoomComponent` (szkielet tworzy ten task, treść tasks 08–09).
- `RoomComponent` przy wejściu:
  - brak sesji albo sesja z innym kodem: formularz nicku, `joinRoom`, zapis sesji (wejście z linku `/room/{code}`);
  - sesja dla tego kodu: od razu lobby lub gra.
- Kod wpisywany bez rozróżniania wielkości liter (zamiana na wielkie).
- Deep link `/spy/room/{code}` działa na GitHub Pages dzięki `docs/404.html` (kopia `index.html`).

## Weryfikacja
Dwa okna (osobne profile lub incognito, bo localStorage jest współdzielone): host tworzy pokój, drugi gracz wchodzi linkiem i podaje nick, trzeci wpisuje kod na Home. Wszyscy lądują w `/room/{code}`. Odświeżenie strony nie gubi sesji.
