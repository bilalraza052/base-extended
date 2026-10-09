import { DOCUMENT } from "@angular/common";
import { HostListener, inject, Injectable, Injector, TemplateRef } from "@angular/core";
import { MatDialog, MatDialogRef } from "@angular/material/dialog";
import { MatSnackBar } from "@angular/material/snack-bar";
import { Router } from "@angular/router";
import { Dialog, DialogWrapper } from "../shared/components/dialog-wrapper/dialog-wrapper";
import { DeleteConfirmation, DeleteConfirmationData } from "../shared/components/delete-confirmation/delete-confirmation";
import { ErrorDialog, ErrorDialogData } from "../shared/components/error-dialog/error-dialog";
import { WarningDialog, WarningDialogData } from "../shared/components/warning-dialog/warning-dialog";
import { OslEmailAttachment, OslEmailDialog, OslEmailDialogData, OslEmailSendResult } from "../shared/components/email-dialog/email-dialog";
import { DirtyStateService } from "../services/dirty-state.service";
@Injectable()

export class baseComponent{
    private _injector = inject(Injector);

    protected showSuccess(message:any){
        if(Array.isArray(message)){
            message = message.join(',')
        }
        this.showSnack(message)
    }


    protected showError(error: string | string[], title: string = 'Validation Failed'): void {
        if (Array.isArray(error) && error.length > 4) {
            const dialogData: ErrorDialogData = { title, errors: error };
            this._injector.get(MatDialog).open(ErrorDialog, {
                width: '460px',
                data: dialogData,
                disableClose: false,
            });
            return;
        }
        const message = Array.isArray(error) ? error.join(', ') : error;
        this.showSnack(message);
    }

    protected navigate(url:string){
        this._injector.get(Router).navigate([url])
    }

    private showSnack(message:string){
        message =  message.replace(/<[^>]*>/g, '');
        this._injector.get(MatSnackBar).open(message,'Ok',{
            duration:3000
        })
    }

    protected openDialog(
        header?:string|TemplateRef<any>,
        formBody?:TemplateRef<any>,
        formFooter?:TemplateRef<any>,
        width:string = '40vw',
        data?:any,
        component?:any,
        isDraggable:boolean = false
    ):MatDialogRef<any>{
        const dialogData:Dialog= {
            header:header,
            formBody:formBody,
            formFooter:formFooter,
            data:data,
            component:component,
            isDraggable:isDraggable
        }
        const dialogRef = this._injector.get(MatDialog)?.open(DialogWrapper,{
            width:width,
            maxWidth:'80vw',
            data:{...dialogData,...data},

        })
        return dialogRef;
    }

    protected openDeleteDialog(
        message: string = 'Are you sure you want to delete this item?',
        title: string = 'Delete Confirmation',
        confirmText: string = 'Delete',
        cancelText: string = 'Cancel',
        data?: any,
    ): MatDialogRef<DeleteConfirmation> {
        const dialogData: DeleteConfirmationData = { title, message, confirmText, cancelText, data };
        return this._injector.get(MatDialog).open(DeleteConfirmation, {
            width: '380px',
            data: dialogData,
            disableClose: true,
        });
    }

    protected openWarningDialog(
        title: string,
        message: string,
        onYesClick?: () => void,
        onClose?: () => void,
        yesText: string = 'Yes',
        noText: string = 'No',
        data?: any,
    ): MatDialogRef<WarningDialog> {
        const dialogData: WarningDialogData = { title, message, yesText, noText, data };
        const dialogRef = this._injector.get(MatDialog).open(WarningDialog, {
            width: '380px',
            data: dialogData,
            disableClose: true,
        });
        dialogRef.afterClosed().subscribe((confirmed: boolean) => {
            if (confirmed) {
                onYesClick?.();
            } else {
                onClose?.();
            }
        });
        return dialogRef;
    }

    protected openEmailDialog(
        to: string[] = [],
        cc: string[] = [],
        subject: string = '',
        body: string = '',
        attachments: OslEmailAttachment[] = [],
        onSendClick?: (result: OslEmailSendResult) => Promise<any> | any,
        title: string = 'Compose Email',
    ): MatDialogRef<OslEmailDialog> {
        const dialogData: OslEmailDialogData = { title, to, cc, subject, body, attachments, onSendClick };
        return this._injector.get(MatDialog).open(OslEmailDialog, {
            width: '640px',
            maxWidth: '92vw',
            data: dialogData,
            disableClose: true,
            autoFocus: false,
        });
    }

       protected isValidBeforeSave<T>(formElements: T[], model: any): string[] {
        const errors: string[] = [];
        this._collectValidationErrors(formElements, model, errors);
        return errors;
    }

    protected isValidFormGrid(columns: { key: string; displayName: string; label?: string; formElem?: { required?: boolean; requiredIf?: (row: any) => boolean; elementType?: string; inputType?: string } }[], datasource: any[]): string[] {
        const errors: string[] = [];
        datasource.forEach((row, rowIndex) => {
            const rowNum = rowIndex + 1;
            for (const col of columns) {
                if (!col.formElem) continue;
                const elem = col.formElem;
                const isRequired = elem.required || elem.requiredIf?.(row);
                const value = row[col.key];
                if (elem.elementType === 'chips-input') {
                    const chips = this._chipValues(value);
                    const typeError = this._chipsTypeError(elem.inputType, chips);
                    if (isRequired && chips.length === 0) {
                        errors.push(`Row ${rowNum}, ${col.label ?? col.displayName} is required`);
                    } else if (typeError) {
                        errors.push(`Row ${rowNum}, ${col.label ?? col.displayName} ${typeError}`);
                    }
                    continue;
                }
                if (!isRequired) continue;
                const isEmpty = value === null || value === undefined || value === ''
                    || (Array.isArray(value) && value.length === 0);
                if (isEmpty) {
                    errors.push(`Row ${rowNum}, ${col.label ?? col.displayName} is required`);
                }
            }
        });
        return errors;
    }

    private _collectValidationErrors<T>(formElements: T[] | any[], model: any, errors: string[]): void {
        for (const el of formElements) {
            if (el.elementType === 'fieldset') {
                if (el.rows?.length) {
                    this._collectValidationErrors(el.rows, model, errors);
                }
                continue;
            }

            if (el.elementType === 'button' || el.elementType === 'templateRef' || el.elementType === 'spacer') {
                continue;
            }

            if (el.hideIf?.(model)) {
                continue;
            }

            const isRequired = el.required || el.requiredIf?.(model);
            const value = model[el.key];
            const isEmpty = value === null || value === undefined || value === ''
                || (Array.isArray(value) && value.length === 0)
                || (el.elementType === 'chips-input' && this._chipValues(value).length === 0);

            if (isRequired && isEmpty) {
                errors.push(`${el.label} is required`);
                continue;
            }

            if (el.elementType === 'chips-input') {
                const typeError = this._chipsTypeError(el.inputType, this._chipValues(value));
                if (typeError) errors.push(`${el.label} ${typeError}`);
                continue;
            }

            if (el.inputType === 'email' && !isEmpty) {
                const emailRegex = /^(?!.*\.\.)(?!.*\.$)[A-Za-z0-9][A-Za-z0-9._%+-]{0,63}@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/
                if (!emailRegex.test(value)) {
                    errors.push(`${el.label} must be a valid email address`);
                }
            }

            if (el.elementType === 'datepicker' && !isEmpty) {
                const dateOnly = typeof value === 'string' && value.includes('T') ? value.split('T')[0] : value;
                const selectedDate = new Date(dateOnly + 'T00:00:00');
                if (!isNaN(selectedDate.getTime())) {
                    const effectiveMin = el.minDateIf?.(model) ?? el.minDate;
                    const effectiveMax = el.maxDateIf?.(model) ?? el.maxDate;
                    if (effectiveMin) {
                        const minDate = new Date(effectiveMin + 'T00:00:00');
                        if (selectedDate < minDate) {
                            errors.push(`${el.label} cannot be before ${this._formatDate(effectiveMin)}`);
                        }
                    }
                    if (effectiveMax) {
                        const maxDate = new Date(effectiveMax + 'T00:00:00');
                        if (selectedDate > maxDate) {
                            errors.push(`${el.label} cannot be after ${this._formatDate(effectiveMax)}`);
                        }
                    }
                }
            }
        }
    }

    /** Normalises a chips-input value (string[] or comma separated string) to its chips. */
    private _chipValues(value: any): string[] {
        const list = Array.isArray(value) ? value : typeof value === 'string' ? value.split(',') : [];
        return list.map(v => String(v ?? '').trim()).filter(v => !!v);
    }

    /** Returns the error suffix when any chip fails the element's inputType, otherwise null. */
    private _chipsTypeError(inputType: string | undefined, chips: string[]): string | null {
        switch (inputType) {
            case 'email': {
                const emailRegex = /^(?!.*\.\.)(?!.*\.$)[A-Za-z0-9][A-Za-z0-9._%+-]{0,63}@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/
                return chips.every(c => emailRegex.test(c)) ? null : 'must contain only valid email addresses';
            }
            case 'number':
                return chips.every(c => /^-?\d+(\.\d+)?$/.test(c)) ? null : 'must contain only valid numbers';
            case 'int':
                return chips.every(c => /^-?\d+$/.test(c)) ? null : 'must contain only whole numbers';
            case 'url':
                return chips.every(c => URL.canParse(c)) ? null : 'must contain only valid URLs';
            default:
                return null;
        }
    }

    private _formatDate(dateStr: string): string {
        const d = new Date(dateStr + 'T00:00:00');
        if (isNaN(d.getTime())) return dateStr;
        return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' });
    }

    protected scrollToInvalidField<T>(formElements: T[], model: any): void {
        const invalid = this._findFirstInvalidElement(formElements as any[], model);
        if (!invalid) return;

        const doc = this._injector.get(DOCUMENT);
        const wrapper = doc.querySelector<HTMLElement>(`[data-field-key="${(invalid as any).key}"]`);
        if (!wrapper) return;

        wrapper.scrollIntoView({ behavior: 'smooth', block: 'center' });

        // Delay focus until scroll settles, then trigger touched state to show validation error
        setTimeout(() => {
            const focusable = wrapper.querySelector<HTMLElement>('input, textarea, [role="combobox"]');
            if (focusable) {
                focusable.focus();
                setTimeout(() => focusable.blur(), 150);
            }
        }, 300);
    }

    protected markFormDirty(saveCallback?: () => Promise<boolean>): void {
        this._injector.get(DirtyStateService).markDirty(saveCallback);
    }

    protected markFormClean(): void {
        this._injector.get(DirtyStateService).markClean();
    }

    @HostListener('window:beforeunload', ['$event'])
    onBeforeUnload(event: BeforeUnloadEvent): void {
        if (this._injector.get(DirtyStateService).isDirty) {
            event.preventDefault();
            event.returnValue = '';
        }
    }

    private _findFirstInvalidElement(formElements: any[], model: any): any {
        for (const el of formElements) {
            if (el.elementType === 'fieldset') {
                if (el.rows?.length) {
                    const found = this._findFirstInvalidElement(el.rows, model);
                    if (found) return found;
                }
                continue;
            }
            if (el.elementType === 'button' || el.elementType === 'templateRef' || el.elementType === 'spacer') continue;
            if (el.hideIf?.(model)) continue;

            const isRequired = el.required || el.requiredIf?.(model);
            const value = model[el.key];
            const isEmpty = value === null || value === undefined || value === ''
                || (Array.isArray(value) && value.length === 0);

            if (isRequired && isEmpty) return el;
        }
        return null;
    }

}