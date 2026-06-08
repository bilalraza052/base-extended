import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  inject,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
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
export class OslAutocomplete extends baseComponent implements OnInit, OnChanges, OnDestroy {
  @Input('label') label: string = '';
  @Input('required') required: boolean = false;
  @Input('disabled') disabled: boolean = false;

  private _model: any = null;
  private _object: any;

  // Fix: removed if(val) guard — _model must be settable to null/0/false
  @Input('model') set model(val: any) {
    this._model = val;
    if (val !== null && val !== undefined && this._object) {
      this.datasource = [this._object];
      this.filteredItems = [...this.datasource];
      this.syncInputFromModel();
      this.datasourceChange.emit(this.datasource);
    }
  }

  get model(): any {
    return this._model;
  }

  @Input('datasource') datasource: any[] = [];
  @Output() datasourceChange = new EventEmitter<any>();
  @Input('displayField') displayField: string = '';
  @Input('valueField') valueField: string = '';
  @Input('placeholder') placeholder: string = 'Type to search...';
  @Input('loading') loading: boolean = false;
  @Input('searchType') searchType: 'Local' | 'Api' = 'Local';
  @Input('methodName') methodName: string = '';
  @Input('configMethodName') configMethodName: string = '';
  @Input('service') service: any;

  @Input('object') set object(val: any) {
    if (val) {
      this._object = val;
      this.datasource = [val];
      this.filteredItems = [...this.datasource];
      this.datasourceChange.emit(this.datasource);
    }
    if (this._model !== null && this._model !== undefined) {
      this.syncInputFromModel();
    }
  }

  @Input('skeletonLoading') skeletonLoading: boolean = false;
  @Input('skeletonTheme') skeletonTheme: 'light' | 'dark' = 'light';
  @Input('isLister') isLister: boolean = false;
  @Input('apiBody') apiBody: any;

  @Output() modelChange = new EventEmitter<any>();
  @Output() changeEv = new EventEmitter<any>();

  private listerComponent = inject(AUTOCOMPLETE_LISTER_COMPONENT);
  inputControl = new FormControl('');

  inputValue: string = '';
  private _showDropdown: boolean = false;
  get showDropdown(): boolean { return this._showDropdown; }
  set showDropdown(val: boolean) {
    this._showDropdown = val;
    if (val) this.updateDropdownPosition();
  }
  dropdownStyle: { [key: string]: string } = {};
  filteredItems: any[] = [];
  touched: boolean = false;

  private scrollHandler = (event: Event) => {
    if (!this._showDropdown) return;
    const dropdown = this.elRef.nativeElement.querySelector('.dropdown');
    if (dropdown && dropdown.contains(event.target as Node)) return;
    this._showDropdown = false;
    this.cdr.markForCheck();
  };

  constructor(
    private elRef: ElementRef,
    public cdr: ChangeDetectorRef,
  ) {
    super();
  }

  ngOnDestroy() {
    document.removeEventListener('scroll', this.scrollHandler, true);
  }

  private updateDropdownPosition() {
    const wrapper = this.elRef.nativeElement.querySelector('.autocomplete-wrapper');
    if (!wrapper) return;
    const rect = wrapper.getBoundingClientRect();
    this.dropdownStyle = {
      'position': 'fixed',
      'top': `${rect.bottom + 5}px`,
      'left': `${rect.left}px`,
      'width': `${rect.width}px`,
    };
    this.cdr.markForCheck();
  }

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
        this.datasourceChange.emit(this.datasource);
        this.filteredItems = [...this.datasource];
        this.selectItem(selectedRow);
      }
    });
  }

  ngOnInit() {
    document.addEventListener('scroll', this.scrollHandler, { capture: true, passive: true });

    if (this.searchType === 'Api' && this.methodName && this.service) {
      this.placeholder = this.isLister ? 'Type to Search Or Press Enter' : 'Type to Search';

      // Fix: [formControl] already updates inputControl on user input, so valueChanges
      // fires once per keystroke. Do NOT call inputControl.setValue() inside onInput
      // for API mode to avoid double emission.
      this.inputControl.valueChanges
        .pipe(debounceTime(500), distinctUntilChanged())
        .subscribe(async (value) => {
          if (!value) return;
          const res: HttpResponse = await this.service[this.methodName](value, this.apiBody);
          if (!res.isSuccessful) return;
          this.datasource = res?.result && Array.isArray(res?.result) ? res.result : res?.result?.data;
          this.datasourceChange.emit(this.datasource);
          this.filteredItems = this.datasource;
          this.cdr.markForCheck();
        });

      if (this._object) {
        this.datasource = [this._object];
        this.datasourceChange.emit(this.datasource);
        this.filteredItems = [...this.datasource];
      }
    }
    this.syncInputFromModel();
    this.cdr.markForCheck();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['datasource']) {
      this.filteredItems = [...(this.datasource || [])];
      // Only sync when dropdown is closed (user is not actively typing/searching)
      if (!this._showDropdown) {
        this.syncInputFromModel();
      }
    }
    if (changes['model']) {
      this.syncInputFromModel();
    }
  }

  private syncInputFromModel() {
    if (this._model !== null && this._model !== undefined) {
      const found = this.datasource?.find((item) => this.getValue(item) === this._model);
      if (found) {
        const display = this.getDisplay(found);
        this.inputValue = display;
        this.inputControl.setValue(display, { emitEvent: false });
      }
    } else {
      this.inputValue = '';
      this.inputControl.setValue('', { emitEvent: false });
    }
    this.cdr.markForCheck();
  }

  getDisplay(item: any): string {
    return item && this.displayField ? item[this.displayField] : String(item);
  }

  getValue(item: any): any {
    return this.valueField ? item[this.valueField] : item;
  }

  get isInvalid(): boolean {
    return this.touched && this.required && !this._model;
  }

  onInput(val: string) {
    // Fix: set _model directly so null is always stored, bypassing the setter's
    // datasource-refresh side effect which should only run on external model changes
    this._model = null;
    this.inputValue = val;

    if (this.searchType === 'Local') {
      this.showDropdown = true;
      this.filteredItems = this.datasource.filter((item) =>
        this.getDisplay(item)?.toLowerCase()?.includes(val?.toLowerCase()),
      );
      if (!val) {
        this.modelChange.emit(null);
        this.changeEv.emit(null);
      }
    } else {
      // API mode: [formControl] already updated inputControl, valueChanges handles the search
      if (!val) {
        this.filteredItems = [];
        this.showDropdown = false;
        this.modelChange.emit(null);
        this.changeEv.emit(null);
      } else {
        this.showDropdown = true;
      }
    }
  }

  onFocus() {
    if (this.loading) return;
    this.showDropdown = true;
    if (this.searchType === 'Local') {
      this.filteredItems = this.datasource.filter((item) =>
        this.getDisplay(item)?.toLowerCase()?.includes(this.inputValue?.toLowerCase()),
      );
    }
  }

  onFocusOut() {
    this.touched = true;
    this.showDropdown = false;
    // Fix: removed auto-select-on-single-match — it caused refill when user
    // cleared text and datasource had only 1 item.
    // If no selection was made, clear the typed text.
    if (this._model === null || this._model === undefined) {
      this.inputValue = '';
      this.inputControl.setValue('', { emitEvent: false });
    }
    this.cdr.markForCheck();
  }

  clearValue(event?: Event) {
    event?.stopPropagation();
    // Fix: set _model directly to null — using the setter would trigger the
    // datasource-refresh side effect unnecessarily
    this._model = null;
    this.inputValue = '';
    this.inputControl.setValue('', { emitEvent: false });
    this.showDropdown = false;
    this.modelChange.emit(null);
    this.changeEv.emit(null);
    this.cdr.markForCheck();
  }

  selectItem(item: any) {
    const display = this.getDisplay(item);
    const value = this.getValue(item);
    this.inputValue = display;
    this.inputControl.setValue(display, { emitEvent: false });
    this._model = value;
    this.modelChange.emit(value);
    this.changeEv.emit(value);
    this.showDropdown = false;
  }

  onHintClick(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    const route: string | undefined = this.service?.route;
    if (!route) return;

    const id = this._model;
    const sep = route.includes('?') ? '&' : '?';
    const paramId = (id !== null && id !== undefined) ? id : 0;
    window.open(`${route}${sep}id=${paramId}`, '_blank');
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!this.elRef.nativeElement.contains(event.target)) {
      this.showDropdown = false;
    }
  }
}
