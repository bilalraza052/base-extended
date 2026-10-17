import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class DirtyStateService {
    private _isDirty = false;
    private _saveCallback?: () => Promise<boolean>;

    get isDirty(): boolean { return this._isDirty; }
    get hasSaveCallback(): boolean { return !!this._saveCallback; }

    markDirty(saveCallback?: () => Promise<boolean>): void {
        this._isDirty = true;
        if (saveCallback) this._saveCallback = saveCallback;
    }

    markClean(): void {
        this._isDirty = false;
        this._saveCallback = undefined;
    }

    async executeSave(): Promise<boolean> {
        if (this._saveCallback) return this._saveCallback();
        return false;
    }
}
