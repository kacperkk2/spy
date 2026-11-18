# 10 — Scenariusz end-to-end i wdrożenie

**Zależy od:** 01–09.

## Zakres
- Test integracyjny (`@SpringBootTest` + `TestRestTemplate`/`WebTestClient`) z pełnym scenariuszem: host tworzy pokój, dołącza 2 graczy, start rundy, każdy `/me` (szpieg bez hasła), dołącza 4. gracz (`participating=false`), reveal, nowa runda (4. gracz już uczestniczy), DELETE.
- Wdrożenie na wybrany hosting z HTTPS (GitHub Pages wymaga HTTPS po stronie API, inaczej przeglądarka zablokuje mixed content). Ustawić `app.cors.allowed-origins` na domenę Pages.
- Zapisać publiczny URL API: front potrzebuje go w `src/environments/environment.prod.ts` (`apiUrl`).

## Kryteria akceptacji
- Scenariusz e2e przechodzi w CI/lokalnie, API dostępne publicznie przez HTTPS.
