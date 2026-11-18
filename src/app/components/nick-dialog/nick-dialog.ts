import { Component, Inject } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { NICK_MAX_LENGTH, nickValidators } from 'src/app/services/room-api/room-api.utils';
import { StorageManagerService } from 'src/app/services/storage-manager/storage-manager.service';

export interface NickDialogData {
  nick: string | null;
  /** Gracz jest w pokoju — zmiana nicku go nie dotyczy (serwer nie wspiera zmiany nicku). */
  inRoom: boolean;
}

/** Ustawienie / zmiana nicku. Zamyka się z przyciętym nickiem; zapis do storage robi wywołujący. */
@Component({
  selector: 'nick-dialog',
  template: `
    <h2 mat-dialog-title fxLayout="row" fxLayoutAlign="center center">
      {{ data.nick ? 'Zmień nick' : 'Ustaw nick' }}
    </h2>
    <mat-dialog-content>
      <form fxLayout="column" fxLayoutAlign="start stretch" (ngSubmit)="save()">
        <mat-form-field appearance="outline">
          <mat-label> Nick </mat-label>
          <input matInput [formControl]="nick" autocomplete="off" cdkFocusInitial [maxlength]="nickMaxLength">
          <mat-error *ngIf="nick.hasError('required')"> Podaj nick </mat-error>
          <mat-error *ngIf="nick.hasError('maxlength')"> Maks. {{ nickMaxLength }} znaków </mat-error>
        </mat-form-field>
        <span *ngIf="data.inRoom" class="grey" style="font-size: 13px; text-align: center;">
          Zmiana nie dotyczy pokoju, w którym już jesteś
        </span>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions fxLayout="row" fxLayoutAlign="space-evenly center">
      <button fxFlex="40" mat-stroked-button [mat-dialog-close]="undefined"> Anuluj </button>
      <button fxFlex="40" mat-flat-button color="primary" [disabled]="nick.invalid" (click)="save()"> Zapisz </button>
    </mat-dialog-actions>
  `,
})
export class NickDialog {

  readonly nickMaxLength = NICK_MAX_LENGTH;
  readonly nick: FormControl<string>;

  constructor(
    private dialogRef: MatDialogRef<NickDialog, string>,
    @Inject(MAT_DIALOG_DATA) public data: NickDialogData,
  ) {
    this.nick = new FormControl<string>(data.nick ?? '', { nonNullable: true, validators: nickValidators });
  }

  save() {
    if (this.nick.valid) {
      this.dialogRef.close(this.nick.value.trim());
    }
  }
}

/** Otwiera dialog nicku i zapisuje wynik w storage; zwraca nowy nick albo undefined (anulowano). */
export function openNickDialog(
  dialog: MatDialog, storage: StorageManagerService, data: NickDialogData,
): Observable<string | undefined> {
  return dialog.open<NickDialog, NickDialogData, string>(NickDialog, {
    data, width: '90%', maxWidth: '400px',
  }).afterClosed().pipe(map(nick => {
    if (nick) {
      storage.saveNick(nick);
    }
    return nick;
  }));
}
