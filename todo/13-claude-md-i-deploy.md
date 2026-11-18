# 13 — Aktualizacja CLAUDE.md i wdrożenie

**Zależy od:** wszystkich poprzednich i wdrożonego backendu (`todo-backend/10-test-e2e-i-deploy.md`).

## Zakres
- `CLAUDE.md`: opisać nową architekturę i usunąć nieaktualne fragmenty (linki z całą grą, `user/:data`, `ExportDialog`, „There is no backend”, „`HttpClientService` is an unused stub”). Opisać:
  - tryb online: pokoje, `RoomApiService`, SSE, sesja w localStorage, losowanie na froncie hosta, kontrakt w `todo-backend/00-kontrakt-api.md`;
  - tryb offline: jedno urządzenie, `CodecService` + `game/<data>`;
  - `environment.apiUrl` (dev/prod).
- `environment.prod.ts`: publiczny HTTPS URL API.
- Przebudowa `docs/` (GitHub Pages): `npx ng build --output-path docs --base-href /spy/ && cp docs/index.html docs/404.html`. Sprawdzić, że `CONFIG.URL_ROOT` (`/spy`) zgadza się z base href i że link `/spy/room/{code}` otwiera się poprawnie.
- Budżet bundla (500 kb warning w `angular.json`): sprawdzić po dodaniu nowych modułów Material.

## Weryfikacja
Pełny scenariusz na wdrożonej wersji: 3 telefony, utworzenie pokoju, dołączenie linkiem i kodem, 2 rundy z reveal, zamknięcie pokoju. Tryb jednego urządzenia działa bez backendu.
