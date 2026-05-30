import { AfterViewInit, Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { formatDate } from '../../../util/date.util';

@Component({
  selector: 'osl-datetimepicker',
  standalone: false,
  templateUrl: './datetimepicker.html',
  styleUrl: './datetimepicker.scss',
})
export class OslDatetimepicker implements AfterViewInit {
  @ViewChild('dtNativeInput') private dtNativeInput!: ElementRef<HTMLInputElement>;

  @Input('label') label: string = '';
  @Input('required') required: boolean = false;
  @Input('disabled') disabled: boolean = false;

  dateModel: Date | null = null;

  @Input('model') set model(val: string) {
    this.dateModel = this._parseToDate(val);
    this._scheduleDisplayUpdate();
  }

  @Input('placeholder') placeholder: string = '';

  minDate: Date | null = null;
  maxDate: Date | null = null;

  @Input('minDatetime') set minDatetime(val: string) {
    this.minDate = this._parseToDate(val);
  }
  @Input('maxDatetime') set maxDatetime(val: string) {
    this.maxDate = this._parseToDate(val);
  }

  /** Emitted string format. Tokens: YYYY MM DD HH mm ss ddd dddd etc. Default: 'YYYY-MM-DDTHH:mm' */
  @Input('format') format: string = 'YYYY-MM-DDTHH:mm';

  /** Display format shown inside the input field. Default: 'ddd DD/MM/YYYY HH:mm' → Sun 18/01/2026 19:18 */
  @Input('displayFormat') set displayFormatInput(val: string) {
    this._displayFormat = val || 'ddd DD/MM/YYYY HH:mm';
    this._scheduleDisplayUpdate();
  }
  private _displayFormat: string = 'ddd DD/MM/YYYY HH:mm';

  @Input('showSeconds') showSeconds: boolean = false;
  @Input('enableMeridian') enableMeridian: boolean = false;

  @Input('skeletonLoading') skeletonLoading: boolean = false;
  @Input('skeletonTheme') skeletonTheme: 'light' | 'dark' = 'light';

  @Output() modelChange = new EventEmitter<string>();
  @Output() changeEv = new EventEmitter<string>();

  ngAfterViewInit(): void {
    this._updateDisplay();
  }

  onDateChange(date: Date | null): void {
    this.dateModel = date;
    this._updateDisplay();
    const str = date ? formatDate(date, this.format) : '';
    this.modelChange.emit(str);
    this.changeEv.emit(str);
  }

  private _updateDisplay(): void {
    if (!this.dtNativeInput) return;
    this.dtNativeInput.nativeElement.value =
      this.dateModel ? formatDate(this.dateModel, this._displayFormat) : '';
  }

  private _scheduleDisplayUpdate(): void {
    setTimeout(() => this._updateDisplay());
  }

  private _parseToDate(val: string): Date | null {
    if (!val) return null;
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
  }
}
