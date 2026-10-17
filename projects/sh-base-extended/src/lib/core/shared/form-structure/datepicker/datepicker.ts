import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { SH_CALENDAR_HOST, ShCalendarHeader, ShCalendarHost } from './calendar-header';
import { MatDatepicker } from '@angular/material/datepicker';

export type DateInputType = 'date' | 'datetime-local' | 'time' | 'month' | 'week' | 'year';

@Component({
  selector: 'sh-datepicker',
  standalone: false,
  templateUrl: './datepicker.html',
  styleUrl: './datepicker.scss',
  providers: [{ provide: SH_CALENDAR_HOST, useExisting: ShDatepicker }],
})
export class ShDatepicker implements ShCalendarHost {
  /** HubSpot calendar header (month label, arrows, Today / Clear). */
  readonly calendarHeader = ShCalendarHeader;
  @ViewChild('picker') private _picker?: MatDatepicker<Date>;
  @Input('label') label: string = '';
  @Input('required') required: boolean = false;
  @Input('disabled') disabled: boolean = false;

  dateValue: Date | null = null;

  private _model: string = '';
  @Input('model') set model(val: string | Date | null | undefined) {
    this._model = val instanceof Date ? this._toString(val) : (val ?? '');
  }
  get model(): string { return this._model; }

  @Input('dateType') dateType: DateInputType = 'date';
  @Input('placeholder') placeholder: string = '';
  /** Shows an inline "x" to clear the value (HubSpot-style). */
  @Input('clearable') clearable: boolean = false;

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

  /** "Today" button inside the calendar panel. */
  selectToday() {
    this._picker?.close();
    this.onDateChange(new Date(new Date().setHours(0, 0, 0, 0)));
  }

  /** "Clear" button inside the calendar panel. */
  clearFromCalendar() {
    this.onClear(this._picker);
  }

  /** "Clear" button inside the calendar panel (and the inline x). */
  onClear(datepicker?: MatDatepicker<Date>) {
    datepicker?.close();
    if (!this._model) return;
    this._model = '';
    this.modelChange.emit('');
    this.changeEv.emit('');
  }

  onYearSelected(normalizedYear: Date, datepicker: MatDatepicker<Date>) {
    const current = this._model ? this._toDate(this._model.split('T')[0]) : null;
    const updated = current ?? new Date();
    updated.setFullYear(new Date(normalizedYear)?.getFullYear());
    datepicker.close();
    this.onDateChange(updated);
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
