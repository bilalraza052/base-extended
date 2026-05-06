import { Component, EventEmitter, Input, Output } from '@angular/core';

export type DateInputType = 'date' | 'datetime-local' | 'time' | 'month' | 'week';

@Component({
  selector: 'osl-datepicker',
  standalone: false,
  templateUrl: './datepicker.html',
  styleUrl: './datepicker.scss',
})
export class OslDatepicker {
  @Input('label') label: string = '';
  @Input('required') required: boolean = false;
  @Input('disabled') disabled: boolean = false;
  private _model: string = '';
  @Input('model') set model(val: string) {
    this._model = val?.includes('T') ? val.split('T')[0] : (val ?? '');
  }
  get model(): string { return this._model; }
  @Input('dateType') dateType: DateInputType = 'date';
  @Input('placeholder') placeholder: string = '';
  @Input('minDate') minDate: string = '';
  @Input('maxDate') maxDate: string = '';
  @Input('skeletonLoading') skeletonLoading: boolean = false;
  @Input('skeletonTheme') skeletonTheme: 'light' | 'dark' = 'light';

  @Output() modelChange = new EventEmitter<string>();
  @Output() changeEv = new EventEmitter<string>();

  onModelChange(event: string) {
    this.model = event;
    this.modelChange.emit(this.model);
  }
}
