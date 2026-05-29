import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'osl-datetimepicker',
  standalone: false,
  templateUrl: './datetimepicker.html',
  styleUrl: './datetimepicker.scss',
})
export class OslDatetimepicker {
  @Input('label') label: string = '';
  @Input('required') required: boolean = false;
  @Input('disabled') disabled: boolean = false;

  private _model: string = '';
  @Input('model') set model(val: string) {
    this._model = this._normalize(val);
  }
  get model(): string { return this._model; }

  @Input('placeholder') placeholder: string = '';
  @Input('minDatetime') minDatetime: string = '';
  @Input('maxDatetime') maxDatetime: string = '';

  @Input('skeletonLoading') skeletonLoading: boolean = false;
  @Input('skeletonTheme') skeletonTheme: 'light' | 'dark' = 'light';

  @Output() modelChange = new EventEmitter<string>();
  @Output() changeEv = new EventEmitter<string>();

  onValueChange(val: string) {
    if (val === this._model) return;
    this._model = val ?? '';
    this.modelChange.emit(this._model);
    this.changeEv.emit(this._model);
  }

  // Trim to YYYY-MM-DDTHH:MM which datetime-local inputs require
  private _normalize(val: string): string {
    if (!val) return '';
    const match = val.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2})/);
    return match ? match[1] : val;
  }
}
