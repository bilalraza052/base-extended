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
  @Input('model') model: any = null;
  @Input('datasource') datasource: any[] = [];
  @Input('displayField') displayField: string = '';
  @Input('valueField') valueField: string = '';
  @Input('placeholder') placeholder: string = 'Type to search...';
  @Input('loading') loading: boolean = false;
  @Input('searchType') searchType: 'Local' | 'Api' = 'Local';
  @Input('methodName') methodName: string = '';
  @Input('configMethodName') configMethodName: string = '';
  @Input('service') service: any;
  @Input('object') object: any;
  @Input('skeletonLoading') skeletonLoading: boolean = false;
  @Output() modelChange = new EventEmitter<any>();
  @Output() changeEv = new EventEmitter<any>();
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
    if (this.searchType == 'Api' && this.methodName && this.service) {
      this.placeholder = 'Type to Search Or Press Enter';
      this.inputControl.valueChanges
        .pipe(debounceTime(500), distinctUntilChanged())
        .subscribe(async (value) => {
          const res:HttpResponse = await this.service[this.methodName](value);
          if(!res.isSuccessful) return
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
