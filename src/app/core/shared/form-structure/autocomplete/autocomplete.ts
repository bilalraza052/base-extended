import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  inject,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { baseComponent } from '../../../base/base.component';
import { AUTOCOMPLETE_LISTER_COMPONENT, oslListerData } from '../autocomplete-lister/autocomplete-lister-types';
import { HttpResponse } from '../../../http/httpbase';

@Component({
  selector: 'osl-autocomplete',
  standalone: false,
  templateUrl: './autocomplete.html',
  styleUrl: './autocomplete.scss',
})
export class OslAutocomplete extends baseComponent implements OnInit, OnChanges {
  @Input('label') label: string = '';
  @Input('required') required: boolean = false;
  @Input('disabled') disabled: boolean = false;
  private _model: any;
  private _object: any;
  @Input('model') set model(val:any){
    if(val){
      this._model = val;
      if(this.object){
        this.datasource = [this.object]
        this.filteredItems = [...this.datasource]
        this.syncInputFromModel()

      }
    }
    
  }

  get model(){
    return this._model
  }
  @Input('datasource') datasource: any[] = [];
  @Input('displayField') displayField: string = '';
  @Input('valueField') valueField: string = '';
  @Input('placeholder') placeholder: string = 'Type to search...';
  @Input('loading') loading: boolean = false;
  @Input('searchType') searchType: 'Local' | 'Api' = 'Local';
  @Input('methodName') methodName: string = '';
  @Input('configMethodName') configMethodName: string = '';
  @Input('service') service: any;
  @Input('object') set object(val:any){
      if(val){
        this._object = val;
        this.datasource = [val]
        this.filteredItems = [...this.datasource]
      }
      if(this.model){
        this.syncInputFromModel()

      }
    }

  get object(){
    return this._object 
  }
  @Input('skeletonLoading') skeletonLoading: boolean = false;
  @Input('skeletonTheme') skeletonTheme: 'light' | 'dark' = 'light';
  @Input('multiple') multiple: boolean = false;
  @Input('isLister') isLister: boolean = false;

  @Output() modelChange = new EventEmitter<any>();
  @Output() changeEv = new EventEmitter<any>();

  @ViewChild('multiInput') multiInputRef: ElementRef<HTMLInputElement> | undefined;

  private listerComponent = inject(AUTOCOMPLETE_LISTER_COMPONENT);
  inputControl = new FormControl('');

  inputValue: string = '';
  showDropdown: boolean = false;
  filteredItems: any[] = [];
  touched: boolean = false;

  constructor(
    private elRef: ElementRef,
    public cdr: ChangeDetectorRef,
  ) {
    super();
  }

  // ── Shared helpers ────────────────────────────────────────────────────────

  getDisplay(item: any): string {
    return item && this.displayField ? item[this.displayField] : String(item);
  }

  getValue(item: any): any {
    return this.valueField ? item[this.valueField] : item;
  }

  get isInvalid(): boolean {
    if (this.multiple) {
      return this.touched && this.required && (!Array.isArray(this.model) || this.model.length === 0);
    }
    return this.touched && this.required && !this.model;
  }

  // ── Single mode ───────────────────────────────────────────────────────────

  openLister() {
    const inputLister: oslListerData = {
      title: this.label,
      methodName: this.methodName,
      configMethodName: this.configMethodName,
      service: this.service,
    };
    const dialogRef = this.openDialog(
      undefined,
      undefined,
      undefined,
      '60vw',
      inputLister,
      this.listerComponent,
    );
    dialogRef.afterClosed().subscribe((selectedRow: any) => {
      if (selectedRow && selectedRow[this.valueField]) {
        this.datasource = [selectedRow];
        this.filteredItems = [...this.datasource];
        this.selectItem(selectedRow);
      }
    });
  }

  ngOnInit() {
    if(this.multiple){
      this.placeholder = 'Type to Search and Select Multiple'
    }
    if (this.searchType == 'Api' && this.methodName && this.service) {
      if(!this.multiple){
        if(this.isLister){
          this.placeholder = 'Type to Search Or Press Enter';
        }else{
          this.placeholder = 'Type to Search';

        }

      }
      this.inputControl.valueChanges
        .pipe(debounceTime(500), distinctUntilChanged())
        .subscribe(async (value) => {
          const res: HttpResponse = await this.service[this.methodName](value);
          if (!res.isSuccessful) return;
          this.datasource = res.result;
          this.filteredItems = res.result;
          this.cdr.markForCheck();
        });

      if (this.object) {
        this.datasource = [this.object];
      }
    }
    this.cdr.markForCheck();
    this.filteredItems = [...this.datasource];
    this.syncInputFromModel();
  }

  ngOnChanges(changes: SimpleChanges) {
    // Always re-initialize filteredItems when the datasource array reference changes
    if (changes['datasource']) {
      this.filteredItems = this.multiple && this.inputValue
        ? this.datasource.filter(item =>
            this.getDisplay(item)?.toLowerCase()?.includes(this.inputValue?.toLowerCase()))
        : [...this.datasource];
    }

    // In multi mode: model changes come back from the parent after our own emit.
    // We must NOT reset the search text or filteredItems, or the user loses their
    // search state after every checkbox toggle.
    if (!this.multiple && changes['model']) {
      this.syncInputFromModel();
    }
  }

  private syncInputFromModel() {
    if (this.model !== null && this.model !== undefined) {
      const found = this.datasource.find((item) => this.getValue(item) === this.model);
      if (found) this.inputValue = this.getDisplay(found);
      this.inputControl.setValue(this.getDisplay(found));
    } else {
      this.inputValue = '';
      this.inputControl.setValue('');
    }
    this.cdr.markForCheck();
  }

  onInput(val: string) {
    if (this.searchType == 'Local') {
      this.inputValue = val;
      if (!this.multiple) this.inputControl.setValue(val);
      this.showDropdown = true;
      this.filteredItems = this.datasource.filter((item) =>
        this.getDisplay(item)?.toLowerCase()?.includes(val?.toLowerCase()),
      );
      if (!this.multiple && !val) {
        this.model = null;
        this.modelChange.emit(null);
      }
    }
  }

  onFocus() {
    if (this.loading) return;
    this.showDropdown = true;
    this.filteredItems = this.datasource.filter((item) =>
      this.getDisplay(item)?.toLowerCase()?.includes(this.inputValue?.toLowerCase()),
    );
  }

  onFocusOut() {
    if (this.multiple) return;
    if (this.inputValue && this.filteredItems.length == 1) {
      this.selectItem(this.filteredItems[0]);
    }
    if (!this.model) {
      this.clearValue();
    }
  }

  onBlur() {
    this.touched = true;
  }

  clearValue(event?: Event) {
    event?.stopPropagation();
    this.inputValue = '';
    this.inputControl.setValue('');
    this.model = null;
    this.modelChange.emit(null);
    this.changeEv.emit(null);
  }

  selectItem(item: any) {
    this.inputValue = this.getDisplay(item);
    this.inputControl.setValue(this.getDisplay(item));
    this.model = this.getValue(item);
    this.modelChange.emit(this.model);
    this.changeEv.emit(this.model);
    this.showDropdown = false;
  }

  // Closing on outside click: guard against removed DOM nodes (chip removal
  // removes the button element before click fires, so target is disconnected).
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as Node;
    if (!document.body.contains(target)) return;
    if (!this.elRef.nativeElement.contains(target)) {
      this.showDropdown = false;
    }
  }

  // ── Multiple mode ─────────────────────────────────────────────────────────

  get selectedValues(): any[] {
    if (!this.multiple || !Array.isArray(this.model)) return [];
    return this.model;
  }

  getDisplayForValue(val: any): string {
    const item = this.datasource.find((i) => this.getValue(i) === val);
    return item ? this.getDisplay(item) : String(val);
  }

  isItemSelected(item: any): boolean {
    return this.selectedValues.includes(this.getValue(item));
  }

  toggleMultiItem(item: any, event: Event) {
    event.preventDefault();
    const val = this.getValue(item);
    const current = Array.isArray(this.model) ? [...this.model] : [];
    const idx = current.indexOf(val);
    if (idx >= 0) current.splice(idx, 1);
    else current.push(val);
    this.model = current;
    this.modelChange.emit(this.model);
    this.changeEv.emit(this.model);
    this.cdr.markForCheck();
  }

  // preventDefault keeps the search input focused so blur/onBlur don't fire.
  removeMultiItem(val: any, event: Event) {
    event.preventDefault();
    event.stopPropagation();
    if (!Array.isArray(this.model)) return;
    this.model = this.model.filter((v) => v !== val);
    this.modelChange.emit(this.model);
    this.changeEv.emit(this.model);
    this.cdr.markForCheck();
    // Re-focus the search input after the chip is removed from the DOM
    setTimeout(() => this.multiInputRef?.nativeElement.focus(), 0);
  }

  clearMultiValue(event: Event) {
    event.preventDefault();
    event.stopPropagation();
    this.inputValue = '';
    this.model = [];
    this.modelChange.emit(this.model);
    this.changeEv.emit(this.model);
    this.filteredItems = [...this.datasource];
    this.showDropdown = true;
    this.cdr.markForCheck();
    setTimeout(() => this.multiInputRef?.nativeElement.focus(), 0);
  }

  focusMultiInput() {
    if (!this.disabled) this.multiInputRef?.nativeElement.focus();
  }
}
