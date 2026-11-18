# Przegląd — przejście z gry przez linki na pokoje (API)

## Po co
Dziś tryb wieloosobowy działa tak: twórca w `StartComponent` generuje N linków `game/<data>` (cała runda zakodowana w URL przez `CodecService`, lz-string), a gracze identyfikują się ręcznie wpisanym numerem w localStorage (`UserComponent`). Wady: hasło da się odczytać z linku, numery mogą się powtarzać, nie ma wspólnego stanu.

Nowy model: twórca zakłada **pokój** na serwerze, gracze dołączają **kodem albo linkiem `/room/{code}`** i podają **nick**. Twórca (też gra) losuje rundę na swoim froncie i wysyła ją na serwer. Każdy gracz dostaje z serwera tylko swoją rolę. Zmiany przychodzą przez SSE. **Tryb jednego urządzenia zostaje offline, bez zmian w działaniu.**

## Kontrakt API
`todo-backend/00-kontrakt-api.md`: modele, endpointy, zdarzenia SSE, przejścia stanów i ustalenia produktowe. Backend powstaje w osobnym repo (Spring), a jego taski są w `todo-backend/`.

## Kolejność tasków frontendu
| Plik | Temat | Wymaga backendu |
|---|---|---|
| 01 ✅ | Ukrywanie hasła przy zmianie gracza (offline) | nie |
| 02 ✅ | Walidacja formularza start (offline) | nie |
| 03 ✅ | Wydzielenie logiki losowania rundy | nie |
| 04 ✅ | `apiUrl` + `RoomApiService` (REST) | do testów tak |
| 05 ✅ | Strumień SSE w serwisie | do testów tak |
| 06 ✅ | Sesja pokoju w localStorage | nie |
| 07 ✅ | Home: tworzenie i dołączanie do pokoju | tak |
| 08 ✅ | `RoomComponent`: lobby i panel hosta | tak |
| 09 ✅ | `RoomComponent`: widok roli i reveal | tak |
| 10 ✅ | Usunięcie gry przez linki i `UserComponent` | nie |
| 11 ✅ | Pytania: przekazywanie kategorii | nie |
| 12 ✅ | Obsługa błędów i reconnect | tak |
| 13 ⏳ | Aktualizacja `CLAUDE.md` i deploy (zrobione: `CLAUDE.md`, budżet bundla; zostało: `apiUrl` w `environment.prod.ts` po wdrożeniu backendu + przebudowa `docs/` + test na telefonach) | — |

Bez działającego backendu taski 04–09 można robić na mocku (np. prosty serwer zgodny z kontraktem albo stubbing w testach).

## Konwencje
- Tekst UI po polsku, komponenty Angular Material + `@angular/flex-layout` jak w istniejących ekranach (`game.component.html` to dobry wzór układu: dolny pasek z FAB-ami i `bottom-button`).
- Po zakończeniu taska oznaczyć go w tym pliku (np. ✅ przy numerze) albo usunąć plik.
