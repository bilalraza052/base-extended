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

  dateValue: Date | null = null;

  private _model: string = '';
  @Input('model') set model(val: string) {
    this._model = val
    // const clean = val?.includes('T') ? val.split('T')[0] : (val ?? '');
    // if (clean === this._model) return;
    // this._model = clean;
    // this.dateValue = clean ? this._toDate(clean) : null;
  }
  get model(): string { return this._model; }

  @Input('dateType') dateType: DateInputType = 'date';
  @Input('placeholder') placeholder: string = '';

  private _minDate: string = '';
  minDateObj: Date | null = null;
  @Input('minDate') set minDate(val: string) {
    this._minDate = val ?? '';
    this.minDateObj = this._minDate ? this._toDate(this._minDate) : null;
  }
  get minDate(): string { return this._minDate; }

  private _maxDate: string = '';
  maxDateObj: Date | null = null;
  @Input('maxDate') set maxDate(val: string) {
    this._maxDate = val ?? '';
    this.maxDateObj = this._maxDate ? this._toDate(this._maxDate) : null;
  }
  get maxDate(): string { return this._maxDate; }

  @Input('skeletonLoading') skeletonLoading: boolean = false;
  @Input('skeletonTheme') skeletonTheme: 'light' | 'dark' = 'light';

  @Output() modelChange = new EventEmitter<string>();
  @Output() changeEv = new EventEmitter<string>();

  onDateChange(date: Date | null) {
   const newModel =  date? this._toString(date):null
    if (newModel === this._model) return;
    if(newModel)this._model = newModel;
    this.modelChange.emit(this._model);
    this.changeEv.emit(this._model);
  }

  private _toDate(str: string): Date | null {
    const d = new Date(str + 'T00:00:00');
    return isNaN(d.getTime()) ? null : d;
  }

  private _toString(date: Date): string {
    const d = new Date(date)
    const localISO =
  d.getFullYear() + "-" +
  String(d.getMonth() + 1).padStart(2, "0") + "-" +
  String(d.getDate()).padStart(2, "0") + "T" +
  String(d.getHours()).padStart(2, "0") + ":" +
  String(d.getMinutes()).padStart(2, "0") + ":" +
  String(d.getSeconds()).padStart(2, "0");
  return localISO

  }
}
