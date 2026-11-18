import { AbstractControl, FormControl, FormGroup, FormGroupDirective, NgForm, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';
import { CONFIG } from 'src/app/app.properties';
import { DrawOptions } from './round-draw.service';

// Wspólne dla formularza offline (StartComponent) i ustawień rundy w pokoju (RoundSettingsDialog).

export const PLAYERS_VALIDATORS = [Validators.required, Validators.min(2)];
// 0 szpiegów jest dozwolone celowo (por. randomSpiesCount)
export const SPIES_VALIDATORS = [Validators.required, Validators.min(0)];
export const ONE_SPY_CHANCE_VALIDATORS = [Validators.required, Validators.min(0), Validators.max(100)];

// Walidator grupy: przy ręcznej liczbie szpiegów nie może ich być więcej niż graczy.
// Działa na poziomie FormGroup, więc reaguje też na zmianę liczby graczy.
export const spiesNotMoreThanPlayers: ValidatorFn = (group: AbstractControl): ValidationErrors | null => {
  const spies = group.get('spies');
  const players = group.get('players');
  if (!spies || !players || spies.disabled) {
    return null;
  }
  if (spies.value == null || players.value == null) {
    return null;
  }
  return Number(spies.value) > Number(players.value) ? { spiesExceedPlayers: true } : null;
};

// Pokazuje pole szpiegów jako błędne także przy błędzie grupy spiesExceedPlayers.
export class SpiesErrorStateMatcher implements ErrorStateMatcher {
  isErrorState(control: FormControl | null, form: FormGroupDirective | NgForm | null): boolean {
    if (!control || control.disabled) {
      return false;
    }
    const groupError = !!control.parent?.hasError('spiesExceedPlayers');
    return (control.invalid || groupError) && (control.dirty || control.touched || groupError);
  }
}

/** Kontrolki ustawień losowania (bez pól specyficznych dla trybu). */
export function roundSettingsControls() {
  return {
    spies: new FormControl(1, SPIES_VALIDATORS),
    spiesRandom: new FormControl(false),
    oneSpyChance: new FormControl(30, ONE_SPY_CHANCE_VALIDATORS),
    // domyślnie wszystkie kategorie — żeby pierwsza runda dała się wylosować bez otwierania ustawień
    categories: new FormControl<string[]>(CONFIG.CATEGORIES.map(c => c.name), [Validators.required]),
    categoriesRandom: new FormControl(false),
    showCategory: new FormControl(false),
  };
}

/**
 * Włącza/wyłącza pola zależne od checkboxów „losowa liczba szpiegów” i „losowa kategoria”.
 * Wywołać przed patchValue, żeby odtworzone wartości od razu ustawiły stan pól.
 */
export function bindRandomToggles(form: FormGroup) {
  const spies = form.controls['spies'];
  const oneSpyChance = form.controls['oneSpyChance'];
  const categories = form.controls['categories'];

  const applySpies = (random: boolean) => {
    if (random) {
      spies.clearValidators();
      spies.disable({ emitEvent: false });
      oneSpyChance.setValidators(ONE_SPY_CHANCE_VALIDATORS);
      oneSpyChance.enable({ emitEvent: false });
    } else {
      spies.setValidators(SPIES_VALIDATORS);
      spies.enable({ emitEvent: false });
      oneSpyChance.clearValidators();
      oneSpyChance.disable({ emitEvent: false });
    }
    spies.updateValueAndValidity();
    oneSpyChance.updateValueAndValidity();
  };

  const applyCategories = (random: boolean) => {
    if (random) {
      categories.clearValidators();
      categories.disable({ emitEvent: false });
    } else {
      categories.setValidators([Validators.required]);
      categories.enable({ emitEvent: false });
    }
    categories.updateValueAndValidity();
  };

  applySpies(!!form.controls['spiesRandom'].value);
  applyCategories(!!form.controls['categoriesRandom'].value);
  form.controls['spiesRandom'].valueChanges.subscribe(v => applySpies(!!v));
  form.controls['categoriesRandom'].valueChanges.subscribe(v => applyCategories(!!v));
}

export function toDrawOptions(form: FormGroup): DrawOptions {
  const v = form.getRawValue();
  return {
    categories: v.categories ?? [],
    categoriesRandom: !!v.categoriesRandom,
    spies: Number(v.spies),
    spiesRandom: !!v.spiesRandom,
    oneSpyChance: Number(v.oneSpyChance),
    showCategory: !!v.showCategory,
  };
}

/** Krótki opis ustawień, np. „Szpiedzy: 1 · Kategorie: 3 · kategoria widoczna”. */
export function settingsSummary(opts: DrawOptions): string {
  const spies = opts.spiesRandom ? 'losowo' : String(opts.spies);
  const categories = opts.categoriesRandom
    ? 'Kategoria: losowa'
    : `Kategorie: ${opts.categories.length}/${CONFIG.CATEGORIES.length}`;
  const visibility = opts.showCategory ? 'kategoria widoczna' : 'kategoria ukryta';
  return `Szpiedzy: ${spies} · ${categories} · ${visibility}`;
}

export function restrictNumberCharacters(event: KeyboardEvent) {
  if (['+', '-'].includes(event.key)) {
    event.preventDefault();
  }
}
