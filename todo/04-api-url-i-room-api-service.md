# 04 — `apiUrl` i `RoomApiService` (REST)

Kontrakt: `todo-backend/00-kontrakt-api.md`.

## Zmiana
- `src/environments/environment.ts`: `apiUrl: 'http://localhost:8080/api'`. `environment.prod.ts`: publiczny URL API (do uzupełnienia po wdrożeniu backendu, task backend 10).
- Interfejsy DTO z kontraktu w `src/app/services/room-api/room-api.models.ts`.
- `src/app/services/room-api/room-api.service.ts` (zastępuje pusty stub `src/app/http-client.service.ts`; stub i jego spec usunąć). Metody zwracające `Observable`:
  - `createRoom(nick)`, `joinRoom(code, nick)`;
  - `getState(code)`, `getMe(code)`, `getReveal(code)`;
  - `startRound(code, req: StartRoundRequest)`, `reveal(code)`, `closeRoom(code)`.
- Token: `HttpInterceptor` dokłada `X-Player-Token` do żądań na `apiUrl`, biorąc token z sesji (task 06). Do czasu taska 06 serwis może przyjmować token parametrem.
- Błędy: mapować `HttpErrorResponse` na `ErrorDto.error`, żeby UI mógł reagować na kody (`NICK_TAKEN` itd.).
- `HttpClientModule` jest już w `app.module.ts`.

## Weryfikacja
Spec z `HttpClientTestingModule`: poprawne URL-e, metody i nagłówek tokenu.
