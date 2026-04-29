import { Component, EventEmitter, Input, Output } from '@angular/core';

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
  @Input('model') model: string = '';
  @Output() modelChange = new EventEmitter<string>();
  @Output() changeEv = new EventEmitter<string>();

  onModelChange(event: string) {
    this.model = event;
    this.modelChange.emit(this.model);
  }
}
