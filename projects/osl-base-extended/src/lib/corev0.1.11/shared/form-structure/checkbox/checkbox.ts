import { Component, ElementRef, EventEmitter, Input, OnChanges, Output, SimpleChanges, ViewChild } from '@angular/core';

@Component({
  selector: 'osl-checkbox',
  standalone: false,
  templateUrl: './checkbox.html',
  styleUrl: './checkbox.scss',
})
export class OslCheckbox implements OnChanges {
  @ViewChild('checkboxEl') checkboxEl!: ElementRef<HTMLInputElement>;

  @Input('label') label: string = '';
  @Input('disabled') disabled: boolean = false;
  @Input('required') required: boolean = false;
  @Input('model') model: boolean = false;
  @Input('indeterminate') indeterminate: boolean = false;
  @Output() modelChange = new EventEmitter<boolean>();
  @Output() changeEv = new EventEmitter<boolean>();

  touched = false;

  get isInvalid(): boolean {
    return this.touched && this.required && !this.model;
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['indeterminate'] && this.checkboxEl) {
      this.checkboxEl.nativeElement.indeterminate = this.indeterminate;
    }
  }

  ngAfterViewInit() {
    if (this.checkboxEl) {
      this.checkboxEl.nativeElement.indeterminate = this.indeterminate;
    }
  }

  onModelChange(event: boolean) {
    this.touched = true;
    this.model = event;
    this.modelChange.emit(this.model);
    this.changeEv.emit(this.model);
  }
}
