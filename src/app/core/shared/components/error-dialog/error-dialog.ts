import { Component, Inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';

export interface ErrorDialogData {
  title: string;
  errors: string[];
}

@Component({
  selector: 'error-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule],
  templateUrl: './error-dialog.html',
  styleUrl: './error-dialog.scss',
})
export class ErrorDialog {
  constructor(
    public dialogRef: MatDialogRef<ErrorDialog>,
    @Inject(MAT_DIALOG_DATA) public data: ErrorDialogData
  ) {}

  close() {
    this.dialogRef.close();
  }
}
