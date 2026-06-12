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
  private _model: any;
  @Input('model')  set model(val:any){
    this._model = val

  }
  get model(){
    return this._model
  }
  @Input('skeletonLoading') skeletonLoading: boolean = false;
  @Input('skeletonTheme') skeletonTheme: 'light' | 'dark' = 'light';

  @Output() modelChange = new EventEmitter<any>();


  private datasourceCache = inject(DatasourceCacheService);
  constructor(public cdr:ChangeDetectorRef){

  }
  ngOnInit(): void {
    this.loadApiDatasources();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['elements'] || changes['model']) {
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
      } else if (elem.apiService && elem.apiMethod && (!elem.searchType || elem.searchType == 'Local')) {
        if (elem.dependsOn?.length) {
          const allReady = elem.dependsOn.every(k => this.model?.[k] != null);
          if (!allReady) continue;
          if (elem.datasource?.length) continue;
        }
        elem.loadingIf = ()=>true
      const data =  await this.datasourceCache.load(elem.apiService, elem.apiMethod, elem.apiBody? elem.apiBody(this.model):null)
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



  onSelectChange(elem: elements, value: any) {
    if (!elem.change) return;
    let selectedObj: any = undefined;
    if (elem.datasource) {
      if (Array.isArray(value)) {
        selectedObj = value.map(v =>
          elem.datasource!.find(item => (elem.valueField ? item[elem.valueField] : item) === v) ?? null
        );
      } else if (value !== null && value !== undefined) {
        selectedObj = elem.datasource.find(item =>
          (elem.valueField ? item[elem.valueField] : item) === (isNaN(Number(value))?value:Number(value))
        ) ?? null;
      } else {
        selectedObj = null;
      }
    }
    elem.change(this.model, undefined, selectedObj);
  }

  onFieldChange(elem: elements, value: any) {
    this.model[elem.key] = value;
    this.modelChange.emit(this.model);
    if (elem.change) this.onSelectChange(elem, value);
    this._refreshDependents(elem.key);
  }

  private async _refreshDependents(changedKey: string): Promise<void> {
    const dependents = this._flatElements().filter(e => e.dependsOn?.includes(changedKey));
    for (const dep of dependents) {
      let valueCleared = false;

      // If any parent dependency is now null, clear field + datasource without API call
      const anyDepNull = dep.dependsOn!.some(k => this.model[k] == null);
      if (anyDepNull) {
        if (this.model[dep.key] != null) { this.model[dep.key] = null; valueCleared = true; }
        dep.datasource = [];
        this.cdr.markForCheck();
        if (valueCleared) await this._refreshDependents(dep.key);
        continue;
      }

      const body = dep.apiBody ? dep.apiBody(this.model) : undefined;

      if (dep.searchType !== 'Api' && dep.apiService && dep.apiMethod) {
        dep.loadingIf = () => true;
        this.cdr.markForCheck();
        try {
          const res = await dep.apiService[dep.apiMethod](body);
          dep.datasource = Array.isArray(res) ? res : (res?.result ?? []);
        } finally {
          dep.loadingIf = () => false;
        }
        const cur = this.model[dep.key];
        if (cur != null) {
          const exists = dep.datasource!.some(item =>
            (dep.valueField ? item[dep.valueField] : item) === cur
          );
          if (!exists) { this.model[dep.key] = null; valueCleared = true; }
        }
      } else if (dep.searchType === 'Api') {
        if (this.model[dep.key] != null) { this.model[dep.key] = null; valueCleared = true; }
      }

      this.cdr.markForCheck();
      if (valueCleared) await this._refreshDependents(dep.key);
    }
  }

  private _flatElements(list = this.elements): elements[] {
    return list.flatMap(e => e.rows?.length ? [e, ...this._flatElements(e.rows)] : [e]);
  }
}

export interface elements {
  columns: number;
  label: string;
  elementType: 'button' | 'checkbox' | 'textbox' | 'textarea' | 'radio' | 'select' | 'datepicker' | 'datetimepicker' | 'file-uploader' | 'autocomplete' | 'slide-toggle' | 'fieldset' | 'templateRef' | 'chips-input' | 'spacer';
  key: string;
  /** Child elements rendered inside a fieldset. Only used when elementType is 'fieldset'. */
  rows?: elements[];
  change?: (model: any, index?: any, selectedObj?: any) => void;
  disabled?: boolean;
  hide?: boolean;
  disabledIf?: (row:any, index?:any) => boolean;
  hideIf?: (model: any) => boolean;
  minDateIf?: (model: any) => string;
  maxDateIf?: (model: any) => string;
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
  apiBody?:(model:any)=>any,
  /** Model keys this field depends on. When any change, datasource is refreshed automatically. */
  dependsOn?: string[];

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
  onlyChars?: boolean;
  /** Enforce N decimal places on osl-input. Shows 0.00 when blank; auto-pads on blur. */
  decimalPortion?: number;

  // ── osl-textarea ──────────────────────────────────
  textareaRows?: number;
  characterCounter?: boolean;
  resize?: TextareaResize;

  // ── osl-select ────────────────────────────────────
  selectPlaceholder?: string;
  clearable?: boolean;
  /** Enable multi-select mode — model becomes any[]. */
  selectMultiple?: boolean;
  /** Show a "Select All" checkbox at the top of the multi-select dropdown. Only applies when selectMultiple is true. */
  showSelectAll?: boolean;

  // ── osl-datepicker ────────────────────────────────
  dateType?: DateInputType;
  minDate?: string;
  maxDate?: string;

  // ── osl-datetimepicker ────────────────────────────
  minDatetime?: string;
  maxDatetime?: string;
  minDatetimeIf?: (model: any) => string;
  maxDatetimeIf?: (model: any) => string;
  /** Output format tokens: YYYY MM DD HH mm ss. Default: 'YYYY-MM-DDTHH:mm' */
  datetimepickerFormat?: string;
  datetimepickerShowSeconds?: boolean;
  datetimepickerEnableMeridian?: boolean;

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
  /** When 'base64', the model key stores OslFileValue instead of a File object. */
  fileMode?: 'raw' | 'base64';
  /** Called when user clicks download on a saved file (no base64 content). Receives current model. */
  fileDownloadFn?: (model: any) => void;

  // ── osl-checkbox ──────────────────────────────────
  indeterminate?: boolean;

  // ── osl-autocomplete ──────────────────────────────
  autocompletePlaceholder?: string;
  /** Enable multiple selection with checkboxes — model becomes any[]. */
  autocompleteMultiple?: boolean;

  templateRef?:TemplateRef<any>
  searchType?:'Api' | 'Local';
  objectName?:string;
  isListerAutocomplete?:boolean
  isCapitalize?:boolean
}
