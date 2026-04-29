import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'osl-slide-toggle',
  standalone: false,
  templateUrl: './slide-toggle.html',
  styleUrl: './slide-toggle.scss',
})
export class OslSlideToggle {
  @Input('label') label: string = '';
  @Input('disabled') disabled: boolean = false;
  @Input('model') model: boolean = false;
  @Input('labelPosition') labelPosition: 'before' | 'after' = 'after';
  @Input('trueLabel') trueLabel: string = '';
  @Input('falseLabel') falseLabel: string = '';
  @Input('skeletonLoading') skeletonLoading: boolean = false;

  @Output() modelChange = new EventEmitter<boolean>();
  @Output() changeEv = new EventEmitter<boolean>();

  get stateLabel(): string {
    if (this.model && this.trueLabel) return this.trueLabel;
    if (!this.model && this.falseLabel) return this.falseLabel;
    return '';
  }

  onModelChange(event: boolean) {
    this.model = event;
    this.modelChange.emit(this.model);
    this.changeEv.emit(this.model);
  }
}
