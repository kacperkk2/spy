# 10 — Usunięcie gry przez linki i numerów graczy

**Zależy od:** 07 (Home już nie używa numeru gracza), 03.

## Zmiana
- `StartComponent` (`src/app/components/start/*`) obsługuje tylko tryb jednego urządzenia:
  - usunąć pole „Liczba rund” (`links`), checkbox „Graj na jednym urządzeniu” (`oneDevice`), `checkedOneDevice`, `getLinks`, `getLink`, `appRoot`, `gamePath`;
  - „Stwórz” zawsze nawiguje do `/game/<data>`.
- Usunąć `ExportDialog` (`src/app/export-dialog/*`) i jego deklarację w `app.module.ts`.
- Usunąć `UserComponent` (`src/app/components/user/*`), trasy `user` i `user/:data`, `CONFIG.USER_ID_KEY`, `getUserId/saveUserId`.
- `GameComponent`: usunąć gałąź multi-device (odczyt `user_id`, przekierowanie na `/user`). Zawsze siatka graczy.
- `Settings.oneDevice` i jego pole w `CodecService`: można usunąć (zmienia format `game/<data>`, ale te linki żyją tylko w obrębie jednej sesji na jednym urządzeniu, więc nic nie szkodzi). Zaktualizować `compress`/`decompress` razem.
- Zapisany w localStorage `form` może mieć stare pola (`links`, `oneDevice`). `patchValue` je zignoruje, więc wystarczy to sprawdzić.

## Weryfikacja
`npm run build` bez błędów. Tryb jednego urządzenia działa od Home do gry. `grep -r "user_id\|ExportDialog\|oneDevice" src` nic nie zwraca (poza ewentualnymi świadomymi wyjątkami).
