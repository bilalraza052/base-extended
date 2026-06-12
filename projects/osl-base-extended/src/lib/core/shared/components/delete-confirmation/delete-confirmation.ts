import { Component, Inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'delete-confirmation',
  imports: [MatDialogModule, MatButtonModule],
  templateUrl: './delete-confirmation.html',
  styleUrl: './delete-confirmation.scss',
})
export class DeleteConfirmation {
  constructor(
    public dialogRef: MatDialogRef<DeleteConfirmation>,
    @Inject(MAT_DIALOG_DATA) public data: DeleteConfirmationData
  ) {}

  confirm() {
    this.dialogRef.close(true);
  }

  cancel() {
    this.dialogRef.close(false);
  }
}

export class DeleteConfirmationData {
  title: string = 'Delete Confirmation';
  message: string = 'Are you sure you want to delete this item?';
  confirmText: string = 'Delete';
  cancelText: string = 'Cancel';
  data?: any;
}
