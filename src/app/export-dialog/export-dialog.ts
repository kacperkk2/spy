import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'export-dialog',
  templateUrl: 'export-dialog.html',
  styleUrls: ['./export-dialog.scss']
})
export class ExportDialog {

  constructor(
    public dialogRef: MatDialogRef<ExportDialog>, 
    @Inject(MAT_DIALOG_DATA) public data: ExportDialogInput,
    private snackBar: MatSnackBar) {
  }

  getDataToCopy() {
    return this.data.urls.join("\n\n");
  }

  close() {
    this.snackBar.open('Skopiowano do schowka', 'Zamknij', {
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
      duration: 3 * 1000,
    });
    this.dialogRef.close();
  }
}

export class ExportDialogInput {
  constructor(public urls: string[]) {}
}