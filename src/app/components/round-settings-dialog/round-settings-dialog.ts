import { Component, Inject } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CONFIG } from 'src/app/app.properties';
import { DrawOptions } from 'src/app/services/round-draw/round-draw.service';
import {
  bindRandomToggles,
  restrictNumberCharacters,
  roundSettingsControls,
  SpiesErrorStateMatcher,
  spiesNotMoreThanPlayers,
  toDrawOptions,
} from 'src/app/services/round-draw/round-settings.form';
import { StorageManagerService } from 'src/app/services/storage-manager/storage-manager.service';

export interface RoundSettingsDialogData {
  playersCount: number;
}

/** `saved` — zapisano ustawienia. */
export type RoundSettingsDialogResult = 'saved' | undefined;

/**
 * Formularz ustawień rundy (wspólny dla pokoju i jednego urządzenia), odtworzony z zapisanego
 * formularza (CONFIG.FORM_KEY). `players` to ukryta kontrolka z liczbą graczy — tylko do walidacji liczby szpiegów.
 */
export function createRoundSettingsForm(storageManager: StorageManagerService, playersCount: number): FormGroup {
  const form = new FormGroup({
    players: new FormControl(playersCount),
    ...roundSettingsControls(),
  }, { validators: spiesNotMoreThanPlayers });
  bindRandomToggles(form);
  const stored = storageManager.getForm();
  if (stored != null) {
    const { players, ...settings } = stored;
    form.patchValue(settings);
  }
  return form;
}

/** Zapisuje ustawienia rundy, zachowując pozostałe pola zapisu (np. liczbę graczy offline). */
export function saveRoundSettingsForm(storageManager: StorageManagerService, form: FormGroup) {
  const { players, ...settings } = form.getRawValue();
  storageManager.saveForm({ ...(storageManager.getForm() ?? {}), ...settings });
}

/** Zapisane ustawienia jako opcje losowania; `null`, gdy są niepoprawne (trzeba otworzyć dialog). */
export function storedDrawOptions(storageManager: StorageManagerService, playersCount: number): DrawOptions | null {
  const form = createRoundSettingsForm(storageManager, playersCount);
  return form.valid ? toDrawOptions(form) : null;
}

@Component({
  selector: 'round-settings-dialog',
  templateUrl: 'round-settings-dialog.html',
  styleUrls: ['./round-settings-dialog.scss']
})
export class RoundSettingsDialog {

  readonly categoriesTitles = CONFIG.CATEGORIES.map(c => c.name);
  readonly spiesErrorMatcher = new SpiesErrorStateMatcher();
  readonly form: FormGroup;

  get categories() { return this.form.controls['categories'] as FormControl; }
  get categoriesRandom() { return this.form.controls['categoriesRandom'] as FormControl; }
  get spies() { return this.form.controls['spies'] as FormControl; }
  get oneSpyChance() { return this.form.controls['oneSpyChance'] as FormControl; }

  constructor(
    private dialogRef: MatDialogRef<RoundSettingsDialog, RoundSettingsDialogResult>,
    @Inject(MAT_DIALOG_DATA) public data: RoundSettingsDialogData,
    private storageManager: StorageManagerService,
  ) {
    this.form = createRoundSettingsForm(storageManager, data.playersCount);
    this.form.markAllAsTouched();
  }

  save() {
    if (this.form.invalid) {
      return;
    }
    saveRoundSettingsForm(this.storageManager, this.form);
    this.dialogRef.close('saved');
  }

  restrictCharacters(event: KeyboardEvent) {
    restrictNumberCharacters(event);
  }
}
