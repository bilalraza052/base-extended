import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'osl-dynamic-form',
  standalone: false,
  templateUrl: './dynamic-form.html',
  styleUrl: './dynamic-form.scss',
})
export class DynamicForm {
  @Input('elements') elements: elements[] = [];
  @Input('model') model: any = {};
  @Output() modelChange = new EventEmitter<any>();

  onModelChange(event: any, key: any) {
    this.model[key] = event;
    this.modelChange.emit(this.model);
  }
}

export interface elements {
  columns: number;
  label: string;
  elementType: 'button' | 'checkbox' | 'textbox' | 'textarea' | 'radio' | 'select' | 'datepicker' | 'file-uploader' | 'autocomplete' | 'slide-toggle' | 'fieldset';
  key: string;
  /** Child elements rendered inside a fieldset. Only used when elementType is 'fieldset'. */
  rows?: elements[];
  change?: (model: any) => void;
  disabled?: boolean;
  hide?: boolean;
  disabledIf?: () => boolean;
  hideIf?: (model:any) => boolean;
  datasource?: any[];
  displayField?: string;
  valueField?: string;
  required?: boolean;
  requiredIf?: (model: any) => boolean;
  textareaRows?: number;
  accept?: string;
  loadingIf?:(model:any)=>boolean
}
