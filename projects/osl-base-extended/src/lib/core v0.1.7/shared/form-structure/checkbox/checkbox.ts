import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'osl-checkbox',
  standalone: false,
  templateUrl: './checkbox.html',
  styleUrl: './checkbox.scss',
})
export class OslCheckbox {
  @Input('label') label: string = '';
  @Input('disabled') disabled: boolean = false;
  @Input('model') model: boolean = false;
  @Output() modelChange = new EventEmitter<boolean>();
  @Output() changeEv = new EventEmitter<boolean>();

  onModelChange(event: boolean) {
    this.model = event;
    this.modelChange.emit(this.model);
    this.changeEv.emit(this.model);
  }
}
