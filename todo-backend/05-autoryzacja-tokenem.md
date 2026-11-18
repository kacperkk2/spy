# 05 — Autoryzacja tokenem gracza

**Zależy od:** 02, 03. Kontrakt: `00-kontrakt-api.md` (sekcja Konwencje).

## Zakres
- Resolver argumentu (np. `@CurrentPlayer player: Player`) albo interceptor, który:
  - czyta `X-Player-Token` z nagłówka, a dla `/events` z query `token`;
  - sprawdza, czy token należy do pokoju `{code}` ze ścieżki (inaczej 401 `UNAUTHORIZED`).
- Pomocnicze `requireHost(room, player)`, które rzuca 403 `NOT_HOST`.
- Bez Spring Security (nie jest potrzebny przy tym modelu). Jeśli jednak użyty, wyłączyć CSRF dla `/api`.

## Kryteria akceptacji
- Testy: brak tokenu daje 401, token innego pokoju daje 401, zwykły gracz na endpoincie hosta dostaje 403.
