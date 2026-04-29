import { ChangeDetectorRef, Component, EventEmitter, inject, Input, OnChanges, OnInit, Output, SimpleChanges, TemplateRef } from '@angular/core';
import { DatasourceCacheService } from '../datasource-cache/datasource-cache.service';
import { InputType } from '../input/input';
import { DateInputType } from '../datepicker/datepicker';
import { TextareaResize } from '../textarea/textarea';

@Component({
  selector: 'osl-dynamic-form',
  standalone: false,
  templateUrl: './dynamic-form.html',
  styleUrl: './dynamic-form.scss',
})
export class DynamicForm implements OnInit, OnChanges {
  @Input('elements') elements: elements[] = [];
  @Input('model')  model:any
  @Input('skeletonLoading') skeletonLoading: boolean = false;

  @Output() modelChange = new EventEmitter<any>();


  private datasourceCache = inject(DatasourceCacheService);
  constructor(public cdr:ChangeDetectorRef){
    
  }
  ngOnInit(): void {
    this.loadApiDatasources();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['elements']) {
      this.loadApiDatasources();
    }
  }

  private loadApiDatasources(): void {
    this._loadForList(this.elements);
  }

  private async _loadForList(list: elements[]): Promise<void> {
    for (const elem of list) {
      if (elem.elementType === 'fieldset' && elem.rows?.length) {
        this._loadForList(elem.rows);
      } else if (elem.apiService && elem.apiMethod && elem.searchType == 'Local') {
        elem.loadingIf = ()=>true
      const data =  await this.datasourceCache.load(elem.apiService, elem.apiMethod, elem.apiBody)
        elem.loadingIf = ()=>false
        this.cdr.markForCheck()

        if(data && data.length > 0){
          elem.datasource = data;

        
        }
      }
    }
  }

  onModelChange(event: any, key: any) {
    this.model[key] = event;
    this.modelChange.emit(this.model);
  }
}

export interface elements {
  columns: number;
  label: string;
  elementType: 'button' | 'checkbox' | 'textbox' | 'textarea' | 'radio' | 'select' | 'datepicker' | 'file-uploader' | 'autocomplete' | 'slide-toggle' | 'fieldset' | 'templateRef';
  key: string;
  /** Child elements rendered inside a fieldset. Only used when elementType is 'fieldset'. */
  rows?: elements[];
  change?: (model: any) => void;
  disabled?: boolean;
  hide?: boolean;
  disabledIf?: () => boolean;
  hideIf?: (model: any) => boolean;
  datasource?: any[];
  displayField?: string;
  valueField?: string;
  required?: boolean;
  requiredIf?: (model: any) => boolean;
  loadingIf?: (model: any) => boolean;
  /** API-based datasource loading */
  apiService?: any;
  apiMethod?: string;
  apiConfigMethod?: string;
  apiBody?: any;

  // ── osl-input ─────────────────────────────────────
  inputType?: InputType;
  placeholder?: string;
  /** Mask pattern: 0=digit, A=letter, *=alphanumeric. E.g. '(000) 000-0000' */
  mask?: string;
  min?: string | number;
  max?: string | number;
  minLength?: number;
  maxLength?: number;
  prefixIcon?: string;
  suffixIcon?: string;

  // ── osl-textarea ──────────────────────────────────
  textareaRows?: number;
  characterCounter?: boolean;
  resize?: TextareaResize;

  // ── osl-select ────────────────────────────────────
  selectPlaceholder?: string;
  clearable?: boolean;

  // ── osl-datepicker ────────────────────────────────
  dateType?: DateInputType;
  minDate?: string;
  maxDate?: string;

  // ── osl-radio ─────────────────────────────────────
  inline?: boolean;

  // ── osl-slide-toggle ──────────────────────────────
  labelPosition?: 'before' | 'after';
  trueLabel?: string;
  falseLabel?: string;

  // ── osl-file-upload ───────────────────────────────
  accept?: string;
  multiple?: boolean;
  maxFileSize?: number;

  // ── osl-checkbox ──────────────────────────────────
  indeterminate?: boolean;

  // ── osl-autocomplete ──────────────────────────────
  autocompletePlaceholder?: string;

  templateRef?:TemplateRef<any>
  searchType?:'Api' | 'Local';
  objectName?:string
}
