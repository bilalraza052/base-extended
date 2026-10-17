import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  ViewChild,
  inject,
} from '@angular/core';
import { CdkConnectedOverlay, ConnectedPosition } from '@angular/cdk/overlay';

/**
 * HubSpot-style select.
 *
 * Same API as osl-select (label, model, datasource, displayField, valueField,
 * placeholder, loading, clearable, required, disabled, skeleton*) plus:
 *  - searchable        search box at the top of the dropdown (HubSpot default)
 *  - multiple          multi-select with checkboxes; selected values render as tags
 *  - descriptionField  optional second line under each option (e.g. an email)
 *
 * Note: unlike the native <select> used by osl-select, the emitted value keeps
 * its original type (numbers stay numbers). Matching is type-tolerant, so a
 * string model still selects a numeric option.
 */
@Component({
  selector: 'sh-select',
  standalone: false,
  templateUrl: './select.html',
  styleUrl: './select.scss',
})
export class ShSelect {
  private _cd = inject(ChangeDetectorRef);

  @Input('label') label: string = '';
  @Input('required') required: boolean = false;
  @Input('disabled') disabled: boolean = false;
  @Input('model') model: any = null;
  @Input('datasource') datasource: any[] = [];
  @Input('displayField') displayField: string = '';
  @Input('valueField') valueField: string = '';
  @Input('placeholder') placeholder: string = '';
  @Input('loading') loading: boolean = false;
  @Input('clearable') clearable: boolean = false;
  @Input('skeletonLoading') skeletonLoading: boolean = false;
  @Input('skeletonTheme') skeletonTheme: 'light' | 'dark' = 'light';

  /** Show a search box inside the dropdown. */
  @Input('searchable') searchable: boolean = true;
  /** Allow selecting multiple values. The model becomes an array of values. */
  @Input('multiple') multiple: boolean = false;
  /** Optional property rendered as a small grey second line under each option. */
  @Input('descriptionField') descriptionField: string = '';
  @Input('searchPlaceholder') searchPlaceholder: string = 'Search';
  @Input('noResultsText') noResultsText: string = 'No results found';
  /** In multiple mode, shows a "Select all" row at the top of the list. */
  @Input('showSelectAll') showSelectAll: boolean = false;

  @Output() modelChange = new EventEmitter<any>();
  @Output() changeEv = new EventEmitter<any>();

  @ViewChild('triggerEl') triggerEl?: ElementRef<HTMLElement>;
  @ViewChild('searchEl') searchEl?: ElementRef<HTMLInputElement>;
  @ViewChild('listEl') listEl?: ElementRef<HTMLElement>;
  @ViewChild(CdkConnectedOverlay) private _overlay?: CdkConnectedOverlay;

  open = false;
  touched = false;
  query = '';
  activeIndex = -1;
  panelWidth = 0;

  readonly positions: ConnectedPosition[] = [
    { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top', offsetY: 4 },
    { originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom', offsetY: -4 },
  ];

  // ── Display helpers ────────────────────────────────────────────
  getDisplay(item: any): string {
    if (item === null || item === undefined) return '';
    return this.displayField ? (item[this.displayField] ?? '') : String(item);
  }

  getValue(item: any): any {
    return this.valueField ? item?.[this.valueField] : item;
  }

  getDescription(item: any): string {
    return this.descriptionField ? (item?.[this.descriptionField] ?? '') : '';
  }

  private _same(a: any, b: any): boolean {
    if (a === b) return true;
    if (a === null || a === undefined || b === null || b === undefined) return false;
    if (typeof a === 'object' || typeof b === 'object') return false;
    return String(a) === String(b);
  }

  private get _modelArray(): any[] {
    if (Array.isArray(this.model)) return this.model;
    if (this.model === null || this.model === undefined || this.model === '') return [];
    return [this.model];
  }

  isSelected(item: any): boolean {
    const v = this.getValue(item);
    return this._modelArray.some(m => this._same(m, v));
  }

  get selectedItems(): any[] {
    const ds = this.datasource ?? [];
    return this._modelArray
      .map(m => ds.find(i => this._same(this.getValue(i), m)))
      .filter(i => i !== undefined);
  }

  get displayText(): string {
    const first = this.selectedItems[0];
    return first !== undefined ? this.getDisplay(first) : '';
  }

  get hasValue(): boolean {
    return this._modelArray.length > 0;
  }

  get isInvalid(): boolean {
    return this.touched && this.required && !this.hasValue;
  }

  get filteredItems(): any[] {
    const ds = this.datasource ?? [];
    const q = this.query.trim().toLowerCase();
    if (!q) return ds;
    return ds.filter(i =>
      this.getDisplay(i).toLowerCase().includes(q) ||
      this.getDescription(i).toLowerCase().includes(q));
  }

  // ── Open / close ───────────────────────────────────────────────
  toggle(): void {
    if (this.disabled || this.loading) return;
    this.open ? this.close() : this.openPanel();
  }

  openPanel(): void {
    if (this.disabled || this.loading) return;
    this.panelWidth = this.triggerEl?.nativeElement.getBoundingClientRect().width ?? 240;
    this.query = '';
    const idx = (this.datasource ?? []).findIndex(i => this.isSelected(i));
    this.activeIndex = idx >= 0 ? idx : 0;
    this.open = true;
  }

  onAttach(): void {
    setTimeout(() => {
      if (this.searchable) this.searchEl?.nativeElement.focus();
      this._scrollActiveIntoView();
    });
  }

  close(refocus: boolean = false): void {
    if (!this.open) return;
    this.open = false;
    this.touched = true;
    if (refocus) this.triggerEl?.nativeElement.focus();
    this._cd.markForCheck();
  }

  // ── Selection ──────────────────────────────────────────────────
  select(item: any): void {
    const value = this.getValue(item);
    if (this.multiple) {
      const arr = [...this._modelArray];
      const at = arr.findIndex(m => this._same(m, value));
      at >= 0 ? arr.splice(at, 1) : arr.push(value);
      this._emit(arr);
      return;
    }
    this._emit(value);
    this.close(true);
  }

  get allFilteredSelected(): boolean {
    const items = this.filteredItems;
    return items.length > 0 && items.every(i => this.isSelected(i));
  }

  toggleSelectAll(): void {
    const items = this.filteredItems;
    if (this.allFilteredSelected) {
      const remove = items.map(i => this.getValue(i));
      this._emit(this._modelArray.filter(m => !remove.some(r => this._same(r, m))));
    } else {
      const arr = [...this._modelArray];
      items.forEach(i => { const v = this.getValue(i); if (!arr.some(m => this._same(m, v))) arr.push(v); });
      this._emit(arr);
    }
  }

  removeTag(item: any, event: Event): void {
    event.stopPropagation();
    if (this.disabled) return;
    const value = this.getValue(item);
    this._emit(this._modelArray.filter(m => !this._same(m, value)));
  }

  onClear(event: Event): void {
    event.stopPropagation();
    this._emit(this.multiple ? [] : null);
  }

  private _emit(value: any): void {
    this.model = value;
    this.touched = true;
    this.modelChange.emit(value);
    this.changeEv.emit(value);
    // Tags may change the trigger height in multiple mode — keep the panel attached below it
    if (this.multiple && this.open) {
      setTimeout(() => this._overlay?.overlayRef?.updatePosition());
    }
  }

  // ── Keyboard ───────────────────────────────────────────────────
  onTriggerKeydown(event: KeyboardEvent): void {
    if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(event.key) && !this.open) {
      event.preventDefault();
      this.openPanel();
    }
  }

  onPanelKeydown(event: KeyboardEvent): void {
    const items = this.filteredItems;
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.activeIndex = Math.min(this.activeIndex + 1, items.length - 1);
        this._scrollActiveIntoView();
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.activeIndex = Math.max(this.activeIndex - 1, 0);
        this._scrollActiveIntoView();
        break;
      case 'Enter':
        event.preventDefault();
        if (items[this.activeIndex] !== undefined) this.select(items[this.activeIndex]);
        break;
      case 'Escape':
        event.preventDefault();
        this.close(true);
        break;
      case 'Tab':
        this.close();
        break;
    }
  }

  onQueryChange(value: string): void {
    this.query = value;
    this.activeIndex = 0;
  }

  private _scrollActiveIntoView(): void {
    setTimeout(() => {
      const el = this.listEl?.nativeElement.querySelector<HTMLElement>('.sh-option.is-active');
      el?.scrollIntoView({ block: 'nearest' });
    });
  }
}
