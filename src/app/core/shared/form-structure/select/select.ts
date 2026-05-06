import { Component, ElementRef, EventEmitter, HostListener, Input, Output } from '@angular/core';

@Component({
  selector: 'osl-select',
  standalone: false,
  templateUrl: './select.html',
  styleUrl: './select.scss',
})
export class OslSelect {
  @Input('label') label: string = '';
  @Input('required') required: boolean = false;
  @Input('disabled') disabled: boolean = false;
  @Input('model') model: any = null;
  @Input('datasource') datasource: any[] = [];
  @Input('displayField') displayField: string = '';
  @Input('valueField') valueField: string = '';
  @Input('placeholder') placeholder: string = 'Select...';
  @Input('loading') loading: boolean = false;
  @Input('clearable') clearable: boolean = false;
  @Input('skeletonLoading') skeletonLoading: boolean = false;
  @Input('skeletonTheme') skeletonTheme: 'light' | 'dark' = 'light';
  @Input('multiple') multiple: boolean = false;
  @Input('showSelectAll') showSelectAll: boolean = false;

  @Output() modelChange = new EventEmitter<any>();
  @Output() changeEv = new EventEmitter<any>();

  isOpen = false;
  multiTouched = false;

  constructor(private elRef: ElementRef) {}

  getDisplay(item: any): string {
    return this.displayField ? item[this.displayField] : item;
  }

  getValue(item: any): any {
    return this.valueField ? item[this.valueField] : item;
  }

  get hasValue(): boolean {
    if (this.multiple) return Array.isArray(this.model) && this.model.length > 0;
    return this.model !== null && this.model !== undefined && this.model !== '';
  }

  // ── Single select ──────────────────────────────────────────────────────────

  onModelChange(event: any) {
    this.model = event === '' ? null : event;
    this.modelChange.emit(this.model);
  }

  onClear(event: Event) {
    event.stopPropagation();
    this.model = this.multiple ? [] : null;
    this.modelChange.emit(this.model);
    this.changeEv.emit(this.model);
    if (this.multiple) this.isOpen = false;
  }

  onChange() {
    this.changeEv.emit(this.model);
  }

  // ── Multi select ───────────────────────────────────────────────────────────

  get isMultiInvalid(): boolean {
    return this.multiTouched && this.required && !this.hasValue;
  }

  get selectedValues(): any[] {
    if (!this.multiple || !Array.isArray(this.model)) return [];
    return this.model;
  }

  get selectedDisplayLabels(): string {
    if (!this.selectedValues.length) return '';
    return this.selectedValues
      .map((val) => {
        const item = this.datasource.find((i) => this.getValue(i) === val);
        return item ? this.getDisplay(item) : val;
      })
      .join(', ');
  }

  get isAllSelected(): boolean {
    return this.datasource.length > 0 && this.selectedValues.length === this.datasource.length;
  }

  get isIndeterminate(): boolean {
    return this.selectedValues.length > 0 && !this.isAllSelected;
  }

  isSelected(item: any): boolean {
    return this.selectedValues.includes(this.getValue(item));
  }

  toggleDropdown() {
    if (this.disabled || this.loading) return;
    this.isOpen = !this.isOpen;
    if (!this.isOpen) this.multiTouched = true;
  }

  toggleItem(item: any, event: Event) {
    event.stopPropagation();
    const val = this.getValue(item);
    const current = Array.isArray(this.model) ? [...this.model] : [];
    const idx = current.indexOf(val);
    if (idx >= 0) current.splice(idx, 1);
    else current.push(val);
    this.model = current;
    this.modelChange.emit(this.model);
    this.changeEv.emit(this.model);
  }

  toggleSelectAll(event: Event) {
    event.stopPropagation();
    this.model = this.isAllSelected ? [] : this.datasource.map((item) => this.getValue(item));
    this.modelChange.emit(this.model);
    this.changeEv.emit(this.model);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!this.elRef.nativeElement.contains(event.target)) {
      if (this.isOpen) this.multiTouched = true;
      this.isOpen = false;
    }
  }
}
