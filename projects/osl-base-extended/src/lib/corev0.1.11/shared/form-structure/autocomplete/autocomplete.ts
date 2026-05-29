import { Component, ElementRef, EventEmitter, HostListener, Input, OnChanges, OnInit, Output } from '@angular/core';

@Component({
  selector: 'osl-autocomplete',
  standalone: false,
  templateUrl: './autocomplete.html',
  styleUrl: './autocomplete.scss',
})
export class OslAutocomplete implements OnInit, OnChanges {
  @Input('label') label: string = '';
  @Input('required') required: boolean = false;
  @Input('disabled') disabled: boolean = false;
  @Input('model') model: any = null;
  @Input('datasource') datasource: any[] = [];
  @Input('displayField') displayField: string = '';
  @Input('valueField') valueField: string = '';
  @Input('placeholder') placeholder: string = 'Type to search...';
  @Input('loading') loading: boolean = false;

  @Output() modelChange = new EventEmitter<any>();
  @Output() changeEv = new EventEmitter<any>();

  inputValue: string = '';
  showDropdown: boolean = false;
  filteredItems: any[] = [];
  touched: boolean = false;

  constructor(private elRef: ElementRef) {}

  ngOnInit() {
    this.filteredItems = [...(this.datasource || [])];
    this.syncInputFromModel();
  }

  ngOnChanges() {
    this.filteredItems = [...(this.datasource || [])];
    this.syncInputFromModel();
  }

  private syncInputFromModel() {
    if (this.model !== null && this.model !== undefined) {
      const found = this.datasource.find(item => this.getValue(item) === this.model);
      if (found) this.inputValue = this.getDisplay(found);
    } else {
      this.inputValue = '';
    }
  }

  getDisplay(item: any): string {
    return this.displayField ? item[this.displayField] : String(item);
  }

  getValue(item: any): any {
    return this.valueField ? item[this.valueField] : item;
  }

  get isInvalid(): boolean {
    return this.touched && this.required && !this.model;
  }

  onInput(val: string) {
    this.inputValue = val;
    this.showDropdown = true;
    this.filteredItems = this.datasource.filter(item =>
      this.getDisplay(item).toLowerCase().includes(val.toLowerCase())
    );
    if (!val) {
      this.model = null;
      this.modelChange.emit(null);
    }
  }

  onFocus() {
    if (this.loading) return;
    this.showDropdown = true;
    this.filteredItems = this.datasource.filter(item =>
      this.getDisplay(item).toLowerCase().includes(this.inputValue.toLowerCase())
    );
  }

  onBlur() {
    this.touched = true;
  }

  clearValue(event: Event) {
    event.stopPropagation();
    this.inputValue = '';
    this.model = null;
    this.modelChange.emit(null);
    this.changeEv.emit(null);
  }

  selectItem(item: any) {
    this.inputValue = this.getDisplay(item);
    this.model = this.getValue(item);
    this.modelChange.emit(this.model);
    this.changeEv.emit(this.model);
    this.showDropdown = false;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!this.elRef.nativeElement.contains(event.target)) {
      this.showDropdown = false;
    }
  }
}
