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
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs';
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
        this.datasourceChange.emit(this.datasource)


      }
    }
    
  }

  get model(){
    return this._model
  }
  @Input('datasource') datasource:any[]=[];
  @Output() datasourceChange = new EventEmitter<any>();
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
        this.datasourceChange.emit(this.datasource)

      }
      if(this.model){
        this.syncInputFromModel()

      }
    }
  @Input('skeletonLoading') skeletonLoading: boolean = false;
  @Input('skeletonTheme') skeletonTheme: 'light' | 'dark' = 'light';
  @Input('isLister') isLister: boolean = false;

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

  constructor(
    private elRef: ElementRef,
    public cdr: ChangeDetectorRef,
  ) {
    super();
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
        this.datasourceChange.emit(this.datasource)
        this.filteredItems = [...this.datasource];
        this.selectItem(selectedRow);
      }
    });
  }

  ngOnInit() {
    if (this.searchType == 'Api' && this.methodName && this.service) {
       if(this.isLister){
          this.placeholder = 'Type to Search Or Press Enter';
        }else{
          this.placeholder = 'Type to Search';

        }
      this.inputControl.valueChanges
        .pipe(debounceTime(500), distinctUntilChanged())
        .subscribe(async (value) => {
          if(!value) return;
          const res:HttpResponse = await this.service[this.methodName](value);
          if(!res.isSuccessful) return
          this.datasource = res?.result && Array.isArray(res?.result) ? res?.result : res?.result?.data;
          this.datasourceChange.emit(this.datasource)

          this.filteredItems = this.datasource
          this.cdr.markForCheck();
        });

      if (this.object) {
        this.datasource = [this.object];
        this.datasourceChange.emit(this.datasource)
        this.filteredItems = [...this.datasource];

      }
    }
    this.cdr.markForCheck();
    this.syncInputFromModel();
  }

  ngOnChanges() {
    this.filteredItems = [...this.datasource];
    this.syncInputFromModel();
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

  getDisplay(item: any): string {
    return item && this.displayField ? item[this.displayField] : String(item);
  }

  getValue(item: any): any {
    return this.valueField ? item[this.valueField] : item;
  }

  get isInvalid(): boolean {
    return this.touched && this.required && !this.model;
  }

  onInput(val: string) {
    this.model = null;
    if (this.searchType == 'Local') {
      this.inputValue = val;
      this.inputControl.setValue(val);
      this.showDropdown = true;

      this.filteredItems = this.datasource.filter((item) =>
        this.getDisplay(item)?.toLowerCase()?.includes(val?.toLowerCase()),
      );
      if (!val) {
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

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!this.elRef.nativeElement.contains(event.target)) {
      this.showDropdown = false;
    }
  }
}
