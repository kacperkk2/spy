# 02 — Walidacja formularza start

**Niezależne od backendu.** Pliki: `src/app/components/start/start.component.ts` i `.html`.

## Problemy
1. „Szpiedzy ≤ gracze” sprawdza tylko `checkSpies()` na `keyup` w polu szpiegów. Zmniejszenie liczby graczy później nie unieważnia formularza.
2. Brak minimum: można wpisać 0 graczy albo 0 szpiegów przy wyłączonym losowaniu (`players` ma tylko `Validators.required`).
3. Pole „Szansa % na jednego szpiega” ma `onKeyPress="if(this.value.length==2) return false;"`, więc nie da się wpisać 100.

## Zmiana
- Zastąpić `checkSpies()` walidatorem na poziomie `FormGroup` (spies ≤ players, gdy `spiesRandom=false`) i usunąć `(keyup)="checkSpies()"`.
- `players`: `Validators.min(2)`. `spies`: `Validators.min(0)` (0 szpiegów jest dozwolone celowo, por. `getRandomSpies`). `oneSpyChance`: `min(0)`, `max(100)`, limit długości 3.
- Pokazać `mat-error` przy błędach.

Uwaga: po tasku 10 pole „Liczba rund” i checkbox `oneDevice` znikają. Ta walidacja zostaje dla trybu offline, a formularz ustawień w pokoju (task 08) powinien ją reużyć.

## Weryfikacja
Gracze 5, szpiedzy 4, potem gracze zmienione na 3: przycisk „Stwórz” musi być nieaktywny. Szansa 100 da się wpisać.
