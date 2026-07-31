import { Component, Inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'warning-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule],
  templateUrl: './warning-dialog.html',
  styleUrl: './warning-dialog.scss',
})
export class WarningDialog {
  constructor(
    public dialogRef: MatDialogRef<WarningDialog>,
    @Inject(MAT_DIALOG_DATA) public data: WarningDialogData
  ) {}

  confirm() {
    this.dialogRef.close(true);
  }

  cancel() {
    this.dialogRef.close(false);
  }
}

export class WarningDialogData {
  title: string = 'Warning';
  message: string = 'Are you sure you want to proceed?';
  yesText: string = 'Yes';
  noText: string = 'No';
  data?: any;
}
