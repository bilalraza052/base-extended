import { Component, EventEmitter, Input, Output } from '@angular/core';

export type TextareaResize = 'none' | 'both' | 'horizontal' | 'vertical';

@Component({
  selector: 'osl-textarea',
  standalone: false,
  templateUrl: './textarea.html',
  styleUrl: './textarea.scss',
})
export class Osltextarea {
  @Input('label') label: string = '';
  @Input('rows') rows: number = 3;
  @Input('required') required: boolean = false;
  @Input('disabled') disabled: boolean = false;
  @Input('model') model: any = '';
  @Input('placeholder') placeholder: string = '';
  @Input('maxLength') maxLength: number | null = null;
  @Input('minLength') minLength: number | null = null;
  @Input('characterCounter') characterCounter: boolean = false;
  @Input('resize') resize: TextareaResize = 'none';
  @Output() modelChange = new EventEmitter<any>();
  @Output() changeEv = new EventEmitter<any>();
  @Input('skeletonLoading') skeletonLoading: boolean = false;


  get currentLength(): number {
    return this.model ? String(this.model).length : 0;
  }

  get showCounter(): boolean {
    return this.characterCounter && this.maxLength !== null;
  }

  get counterClass(): string {
    if (this.maxLength === null) return '';
    return this.currentLength >= this.maxLength ? 'counter-limit' : '';
  }

  onModelChange(event: any) {
    this.model = event;
    this.modelChange.emit(this.model);
  }
}
