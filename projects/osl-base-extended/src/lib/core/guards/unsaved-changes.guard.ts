import { inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { CanDeactivateFn } from '@angular/router';
import { from, of } from 'rxjs';
import { switchMap, tap } from 'rxjs/operators';
import { DirtyStateService } from '../services/dirty-state.service';
import { UnsavedChangesDialog } from '../shared/components/unsaved-changes-dialog/unsaved-changes-dialog';

export const unsavedChangesGuard: CanDeactivateFn<unknown> = () => {
    const dirty = inject(DirtyStateService);
    const dialog = inject(MatDialog);

    if (!dirty.isDirty) return true;

    return dialog.open(UnsavedChangesDialog, {
        // width: '400px',
        maxWidth: '90vw',
        disableClose: true,
        data: { hasSaveCallback: dirty.hasSaveCallback },
    }).afterClosed().pipe(
        switchMap(result => {
            if (result === 'save') {
                return from(dirty.executeSave()).pipe(
                    tap(saved => { if (saved) dirty.markClean(); })
                );
            }
            if (result === 'leave') {
                dirty.markClean();
                return of(true);
            }
            return of(false);
        })
    );
};
