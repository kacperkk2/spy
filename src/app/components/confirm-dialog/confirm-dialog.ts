import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

export interface ConfirmDialogData {
  title: string;
  message?: string;
  confirmLabel: string;
  /** Domyślnie `warn` (akcje nieodwracalne). */
  confirmColor?: 'primary' | 'warn';
}

/** Prosty dialog potwierdzenia — zamyka się z `true` po potwierdzeniu. */
@Component({
  selector: 'confirm-dialog',
  template: `
    <h2 mat-dialog-title fxLayout="row" fxLayoutAlign="center center"> {{ data.title }} </h2>
    <mat-dialog-content *ngIf="data.message" fxLayout="column" fxLayoutAlign="center center">
      <p class="grey" style="text-align: center;"> {{ data.message }} </p>
    </mat-dialog-content>
    <mat-dialog-actions fxLayout="row" fxLayoutAlign="space-evenly center">
      <button fxFlex="40" mat-stroked-button [mat-dialog-close]="false"> Anuluj </button>
      <button fxFlex="40" mat-flat-button [color]="data.confirmColor ?? 'warn'" [mat-dialog-close]="true"> {{ data.confirmLabel }} </button>
    </mat-dialog-actions>
  `,
})
export class ConfirmDialog {
  constructor(@Inject(MAT_DIALOG_DATA) public data: ConfirmDialogData) { }
}
