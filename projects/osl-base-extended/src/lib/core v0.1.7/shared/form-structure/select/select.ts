import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'osl-select',
  standalone: false,
  templateUrl: './select.html',
  styleUrl: './select.scss',
})
export class OslSelect {
  @Input('label') label: string = '';
  @Input('required') required: boolean = false;
  @Input('disabled') disabled: boolean = false;
  @Input('model') model: any = null;
  @Input('datasource') datasource: any[] = [];
  @Input('displayField') displayField: string = '';
  @Input('valueField') valueField: string = '';
  @Output() modelChange = new EventEmitter<any>();
  @Output() changeEv = new EventEmitter<any>();

  getDisplay(item: any): string {
    return this.displayField ? item[this.displayField] : item;
  }

  getValue(item: any): any {
    return this.valueField ? item[this.valueField] : item;
  }

  onModelChange(event: any) {
    this.model = event;
    this.modelChange.emit(this.model);
  }
}
