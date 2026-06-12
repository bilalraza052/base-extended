import { Component, Inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';

export interface UnsavedChangesDialogData {
    hasSaveCallback: boolean;
}

@Component({
    selector: 'unsaved-changes-dialog',
    standalone: true,
    imports: [MatDialogModule, MatButtonModule],
    templateUrl: './unsaved-changes-dialog.html',
    styleUrl: './unsaved-changes-dialog.scss',
})
export class UnsavedChangesDialog {
    constructor(
        public dialogRef: MatDialogRef<UnsavedChangesDialog>,
        @Inject(MAT_DIALOG_DATA) public data: UnsavedChangesDialogData
    ) {}

    save() { this.dialogRef.close('save'); }
    leave() { this.dialogRef.close('leave'); }
    cancel() { this.dialogRef.close(null); }
}
