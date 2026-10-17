import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';

export interface ShEditColumnOption {
  key: string;
  label: string;
}

export interface ShEditColumnsData {
  title?: string;
  /** Every column the user may choose from. */
  columns: ShEditColumnOption[];
  /** Keys currently visible, in display order. */
  visibleKeys: string[];
  /** Keys that are always visible and cannot be removed or moved (e.g. the record name). */
  lockedKeys?: string[];
  /** Optional default order restored by "Reset to default". */
  defaultKeys?: string[];
}

/**
 * HubSpot "Choose which columns you see" dialog.
 * Left pane: searchable checkbox list of every column.
 * Right pane: selected columns, drag to reorder, x to remove, locked columns pinned on top.
 * Closes with the new ordered key list (or undefined when cancelled).
 */
@Component({
  selector: 'sh-edit-columns-dialog',
  standalone: true,
  imports: [MatDialogModule, DragDropModule],
  templateUrl: './edit-columns-dialog.html',
  styleUrl: './edit-columns-dialog.scss',
})
export class ShEditColumnsDialog {
  query = '';
  selected: string[] = [];
  private _labels = new Map<string, string>();

  constructor(
    public dialogRef: MatDialogRef<ShEditColumnsDialog, string[] | undefined>,
    @Inject(MAT_DIALOG_DATA) public data: ShEditColumnsData,
  ) {
    data.columns.forEach(c => this._labels.set(c.key, c.label || c.key));
    const locked = this.locked;
    const rest = (data.visibleKeys ?? []).filter(k => !locked.includes(k) && this._labels.has(k));
    this.selected = [...locked.filter(k => this._labels.has(k)), ...rest];
  }

  get locked(): string[] {
    return this.data.lockedKeys ?? [];
  }

  get title(): string {
    return this.data.title ?? 'Choose which columns you see';
  }

  get filtered(): ShEditColumnOption[] {
    const q = this.query.trim().toLowerCase();
    return q ? this.data.columns.filter(c => (c.label || c.key).toLowerCase().includes(q)) : this.data.columns;
  }

  get movable(): string[] {
    return this.selected.filter(k => !this.isLocked(k));
  }

  label(key: string): string {
    return this._labels.get(key) ?? key;
  }

  isLocked(key: string): boolean {
    return this.locked.includes(key);
  }

  isChecked(key: string): boolean {
    return this.selected.includes(key);
  }

  toggle(key: string): void {
    if (this.isLocked(key)) return;
    this.isChecked(key) ? this.remove(key) : (this.selected = [...this.selected, key]);
  }

  remove(key: string): void {
    if (this.isLocked(key)) return;
    this.selected = this.selected.filter(k => k !== key);
  }

  removeAll(): void {
    this.selected = this.selected.filter(k => this.isLocked(k));
  }

  resetToDefault(): void {
    const def = this.data.defaultKeys ?? this.data.columns.map(c => c.key);
    const rest = def.filter(k => !this.isLocked(k));
    this.selected = [...this.locked, ...rest];
  }

  drop(event: CdkDragDrop<string[]>): void {
    const movable = [...this.movable];
    moveItemInArray(movable, event.previousIndex, event.currentIndex);
    this.selected = [...this.selected.filter(k => this.isLocked(k)), ...movable];
  }

  apply(): void {
    this.dialogRef.close([...this.selected]);
  }

  cancel(): void {
    this.dialogRef.close(undefined);
  }
}
