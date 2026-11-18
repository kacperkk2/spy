# 03 — Wydzielenie logiki losowania rundy

**Niezależne od backendu.** Przygotowanie pod pokoje, gdzie losuje frontend hosta (kontrakt: `todo-backend/00-kontrakt-api.md`, `StartRoundRequest`).

## Stan obecny
W `src/app/components/start/start.component.ts` losowanie jest rozsiane po komponencie: `getDataForLink()`, `getCategory()`, `getSpies()` oraz funkcje modułowe `getRandom`, `randomPlayer`, `getRandomSpies`. Operuje na numerach graczy 1..N.

## Zmiana
- Nowy serwis lub plik `src/app/services/round-draw/round-draw.service.ts` z czystą funkcją, np.:
  ```ts
  interface DrawOptions { categories: string[]; categoriesRandom: boolean; spies: number;
    spiesRandom: boolean; oneSpyChance: number; showCategory: boolean; }
  interface DrawnRound<T> { phrase: string; category: string; showCategory: boolean;
    spyIds: T[]; startingId: T; }
  draw<T>(playerIds: T[], opts: DrawOptions): DrawnRound<T>
  ```
- Tryb offline woła ją z `[1..N]` i mapuje wynik na `Settings` (`category: showCategory ? category : null`). Tryb pokoju woła ją z `playerId` z lobby i mapuje na `StartRoundRequest`.
- Tasowanie przez Fisher-Yatesa zamiast `sort(() => 0.5 - Math.random())` (to tasowanie nie jest równomierne).
- Zachować semantykę `getRandomSpies`: z prawdopodobieństwem `oneSpyChance`% jest 1 szpieg, inaczej równomiernie 0 albo 2..min(gracze, `CONFIG.MAX_SPIES_LIMIT`).
- Spec z testami: liczba szpiegów ≤ liczba graczy, `startingId` należy do `playerIds`, wybrana kategoria należy do zaznaczonych.

## Weryfikacja
`npx ng test --include src/app/services/round-draw/round-draw.service.spec.ts`. Tryb jednego urządzenia działa jak wcześniej.
