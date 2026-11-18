# Kontrakt API — pokoje gry Spy

Wspólne źródło prawdy dla backendu (osobne repo, Java/Kotlin + Spring Boot) i frontendu (to repo, Angular). Każda zmiana kontraktu musi trafić tutaj.

## Ustalenia produktowe

| Temat | Decyzja |
|---|---|
| Dołączanie | Kod pokoju (5 znaków bez mylących `0/O/1/I/L`) + link frontu `/room/{code}` |
| Tożsamość | Nick (unikalny w pokoju, bez rozróżniania wielkości liter, 1–20 znaków po trim) → serwer zwraca `playerId` + `playerToken` |
| Realtime | Akcje przez REST, zdarzenia z serwera przez SSE (`SseEmitter`) |
| Losowanie | Robi frontend twórcy (hasło, kategoria, szpiedzy, kto zaczyna) i wysyła wynik. Serwer przechowuje rundę i każdemu graczowi podaje tylko jego rolę |
| Twórca (host) | Gra jak zwykły gracz i steruje rundami |
| Rundy | Host startuje kolejne rundy bez limitu. Uczestnicy rundy to gracze obecni w pokoju w chwili startu |
| Koniec rundy | Host robi „reveal”, wszyscy widzą hasło, kategorię i szpiegów |
| Dołączenie w trakcie rundy | Dozwolone. Gracz ma `participating=false` do następnej rundy |
| Kick / wyjście / przekazanie hosta | Poza zakresem |
| Życie pokoju | Host zamyka pokój (`DELETE`). Dodatkowo serwer usuwa pokój po 6 h bez aktywności. Stan w pamięci, bez bazy |
| Ustawienia gry | Serwer ich nie zna, są tylko na froncie hosta |
| Lista pokoi | Wszystkie otwarte pokoje są publiczne: ekran główny pokazuje kilka ostatnio aktywnych (domyślnie 3), do pozostałych wchodzi się po kodzie |
| Hosting | Front na GitHub Pages (`https://<user>.github.io`, base `/spy/`), API na innej domenie, potrzebny CORS |

## Konwencje

- Base path: `/api`. JSON, UTF-8.
- Autoryzacja: nagłówek `X-Player-Token: <playerToken>`. Wyjątek to SSE (`EventSource` nie wysyła nagłówków), gdzie token idzie w query `?token=`.
- Kod pokoju w ścieżce traktujemy bez rozróżniania wielkości liter (normalizacja do wielkich).
- Token: losowy, co najmniej 128 bitów (`SecureRandom`, base64url). `playerId`: UUID albo krótki losowy string.

## Modele

```ts
type RoomStatus = 'LOBBY' | 'IN_ROUND' | 'REVEALED' | 'CLOSED';

interface PlayerDto { id: string; nick: string; isHost: boolean; }

interface RoomStateDto {           // publiczny stan, BEZ tajnych danych
  code: string;
  status: RoomStatus;
  players: PlayerDto[];            // w kolejności dołączenia
  roundNumber: number;             // 0 = żadnej rundy jeszcze nie było
  startingPlayerId: string | null; // w IN_ROUND i REVEALED, inaczej null
}

interface RoomSummaryDto {         // publiczne podsumowanie pokoju na liście
  code: string;
  hostNick: string;
  playersCount: number;
  status: 'LOBBY' | 'IN_ROUND' | 'REVEALED';
}

interface RoomListDto {
  rooms: RoomSummaryDto[];         // od ostatnio aktywnego (lastActivityAt malejąco), najwyżej `limit`
  total: number;                   // liczba wszystkich otwartych pokoi (może być > rooms.length)
}

interface CreateRoomResponse { code: string; playerId: string; playerToken: string; }
interface JoinRoomResponse   { playerId: string; playerToken: string; }

interface MyRoleDto {              // tylko dla właściciela tokenu
  playerId: string;
  participating: boolean;          // false = brak rundy albo gracz dołączył w trakcie
  isSpy: boolean;
  phrase: string | null;           // null, jeśli szpieg albo !participating
  category: string | null;         // tylko gdy participating && showCategory
  isStarting: boolean;
}

interface StartRoundRequest {
  phrase: string;                  // niepuste, ≤100 znaków
  category: string;                // niepuste, ≤50 znaków
  showCategory: boolean;
  spyPlayerIds: string[];          // podzbiór graczy pokoju, może być pusty (0 szpiegów to dozwolony wariant)
  startingPlayerId: string;        // gracz pokoju
}

interface RevealDto {
  roundNumber: number;
  phrase: string;
  category: string;
  spyPlayerIds: string[];
}

interface ErrorDto { error: ErrorCode; message?: string; }
type ErrorCode = 'ROOM_NOT_FOUND' | 'ROOM_CLOSED' | 'NICK_TAKEN' | 'UNAUTHORIZED'
               | 'NOT_HOST' | 'INVALID_STATE' | 'VALIDATION' | 'NOT_ENOUGH_PLAYERS';
```

## Endpointy

| Metoda | Ścieżka | Kto | Body → Odpowiedź | Błędy |
|---|---|---|---|---|
| GET | `/api/rooms?limit=3` | każdy (bez tokenu) | → 200 `RoomListDto`; `limit` 1–20, domyślnie 3 | 400 VALIDATION (zły `limit`) |
| POST | `/api/rooms` | każdy | `{nick}` → 201 `CreateRoomResponse` | 400 VALIDATION |
| POST | `/api/rooms/{code}/players` | każdy | `{nick}` → 201 `JoinRoomResponse` | 404 ROOM_NOT_FOUND, 409 NICK_TAKEN, 410 ROOM_CLOSED, 400 VALIDATION |
| GET | `/api/rooms/{code}` | gracz pokoju | → 200 `RoomStateDto` | 401 UNAUTHORIZED, 404 |
| GET | `/api/rooms/{code}/me` | gracz pokoju | → 200 `MyRoleDto` | 401, 404 |
| POST | `/api/rooms/{code}/rounds` | host | `StartRoundRequest` → 200 `RoomStateDto` | 403 NOT_HOST, 409 INVALID_STATE (gdy nie LOBBY/REVEALED), 409 NOT_ENOUGH_PLAYERS (<2), 400 VALIDATION (id spoza pokoju, puste pola) |
| POST | `/api/rooms/{code}/rounds/current/reveal` | host | → 200 `RevealDto` | 403, 409 INVALID_STATE (gdy nie IN_ROUND) |
| GET | `/api/rooms/{code}/reveal` | gracz pokoju | → 200 `RevealDto` | 409 INVALID_STATE (gdy nie REVEALED) |
| DELETE | `/api/rooms/{code}` | host | → 204 | 403 |
| GET | `/api/rooms/{code}/events?token=` | gracz pokoju | `text/event-stream` | 401, 404 |

Token z innego pokoju daje 401. Operacje na pokoju `CLOSED` (poza join, który daje 410) zwracają 404, bo zamknięty pokój jest usuwany z pamięci.

## Przejścia stanów

```
LOBBY --rounds--> IN_ROUND --reveal--> REVEALED --rounds--> IN_ROUND ...
dowolny --DELETE / wygaśnięcie--> CLOSED (pokój usunięty)
```

Każde `rounds` zwiększa `roundNumber` o 1 i zapisuje zbiór uczestników (gracze w pokoju w tej chwili).

## Zdarzenia SSE

Zdarzenia NIE przenoszą tajnych danych. Front po `round-started` dociąga swoją rolę przez `GET /me`.

| `event:` | `data:` | Kiedy |
|---|---|---|
| `room-state` | `RoomStateDto` | zaraz po podłączeniu i przy każdym dołączeniu gracza |
| `round-started` | `RoomStateDto` | po `POST /rounds` |
| `round-revealed` | `RevealDto` | po reveal |
| `room-closed` | `{}` | po `DELETE` lub wygaśnięciu; potem serwer zamyka strumień |

Heartbeat: komentarz SSE (`:ping`) co ~25 s.
