# 01 — Szkielet projektu Spring Boot + CORS

**Kontekst:** backend gry Spy powstaje w osobnym repozytorium. Kontrakt: `00-kontrakt-api.md`.

## Zakres
- Nowy projekt Spring Boot (Kotlin lub Java, Gradle/Maven), moduły `spring-boot-starter-web`, `spring-boot-starter-validation`, `spring-boot-starter-test`.
- Wszystkie kontrolery pod prefiksem `/api`.
- CORS: originy z konfiguracji (`app.cors.allowed-origins`), domyślnie `http://localhost:4200` i domena GitHub Pages. Metody GET, POST, DELETE. Dozwolony nagłówek `X-Player-Token`.
- Healthcheck `GET /api/health` → 200 `{status:"ok"}`.
- README z instrukcją uruchomienia i portem.

## Kryteria akceptacji
- Aplikacja startuje lokalnie, `curl localhost:<port>/api/health` zwraca ok.
- Preflight `OPTIONS` z originu `http://localhost:4200` przechodzi.
