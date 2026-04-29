import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'osl-radio',
  standalone: false,
  templateUrl: './radio.html',
  styleUrl: './radio.scss',
})
export class OslRadio {
  @Input('label') label: string = '';
  @Input('required') required: boolean = false;
  @Input('disabled') disabled: boolean = false;
  @Input('model') model: any = null;
  @Input('datasource') datasource: any[] = [];
  @Input('displayField') displayField: string = '';
  @Input('valueField') valueField: string = '';
  @Input('inline') inline: boolean = false;
  @Output() modelChange = new EventEmitter<any>();
  @Output() changeEv = new EventEmitter<any>();

  private static _idCounter = 0;
  readonly groupName = `osl_radio_${++OslRadio._idCounter}`;

  getDisplay(item: any): string {
    return this.displayField ? item[this.displayField] : item;
  }

  getValue(item: any): any {
    return this.valueField ? item[this.valueField] : item;
  }

  isChecked(item: any): boolean {
    return this.model === this.getValue(item);
  }

  onSelect(item: any) {
    this.model = this.getValue(item);
    this.modelChange.emit(this.model);
    this.changeEv.emit(this.model);
  }
}
