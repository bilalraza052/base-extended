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
  @Input('placeholder') placeholder: string = 'Select...';
  @Input('loading') loading: boolean = false;
  @Input('clearable') clearable: boolean = false;
  @Input('skeletonLoading') skeletonLoading: boolean = false;
  @Input('skeletonTheme') skeletonTheme: 'light' | 'dark' = 'light';

  @Output() modelChange = new EventEmitter<any>();
  @Output() changeEv = new EventEmitter<any>();

  getDisplay(item: any): string {
    return this.displayField ? item[this.displayField] : item;
  }

  getValue(item: any): any {
    return this.valueField ? item[this.valueField] : item;
  }

  onModelChange(event: any) {
    this.model = event === '' ? null : event;
    this.modelChange.emit(this.model);
  }

  onClear(event: Event) {
    event.stopPropagation();
    this.model = null;
    this.modelChange.emit(null);
    this.changeEv.emit(null);
  }

  onChange() {
    this.changeEv.emit(this.model);
  }

  get hasValue(): boolean {
    return this.model !== null && this.model !== undefined && this.model !== '';
  }
}
