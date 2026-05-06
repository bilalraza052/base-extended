import { Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';

@Component({
  selector: 'osl-chips-input',
  standalone: false,
  templateUrl: './chips-input.html',
  styleUrl: './chips-input.scss',
})
export class OslChipsInput {
  @Input('label') label: string = '';
  @Input('required') required: boolean = false;
  @Input('disabled') disabled: boolean = false;
  @Input('model') model: string[] = [];
  @Input('placeholder') placeholder: string = 'Type and press Enter...';
  @Input('skeletonLoading') skeletonLoading: boolean = false;
  @Input('skeletonTheme') skeletonTheme: 'light' | 'dark' = 'light';

  @Output() modelChange = new EventEmitter<string[]>();
  @Output() changeEv = new EventEmitter<string[]>();

  @ViewChild('chipInput') chipInput: ElementRef<HTMLInputElement> | undefined;

  inputValue: string = '';
  touched: boolean = false;

  get isInvalid(): boolean {
    return this.touched && this.required && (!Array.isArray(this.model) || this.model.length === 0);
  }

  get chips(): string[] {
    return Array.isArray(this.model) ? this.model : [];
  }

  onKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      const val = this.inputValue.trim();
      if (val) this.addChip(val);
    } else if (event.key === 'Backspace' && !this.inputValue && this.chips.length) {
      this.removeChip(this.chips.length - 1);
    }
  }

  addChip(value: string) {
    if (!value) return;
    if (!Array.isArray(this.model)) this.model = [];
    if (!this.model.includes(value)) {
      this.model = [...this.model, value];
      this.modelChange.emit(this.model);
      this.changeEv.emit(this.model);
    }
    this.inputValue = '';
    // Reset the DOM value since [value] binding won't fire if already ''
    if (this.chipInput) this.chipInput.nativeElement.value = '';
  }

  // preventDefault on the mousedown event keeps focus on the text input,
  // preventing blur → onBlur → auto-commit of partially typed text.
  removeChip(index: number, event?: Event) {
    event?.preventDefault();
    this.model = this.chips.filter((_, i) => i !== index);
    this.modelChange.emit(this.model);
    this.changeEv.emit(this.model);
  }

  onInput(val: string) {
    this.inputValue = val;
  }

  onBlur() {
    this.touched = true;
    const val = this.inputValue.trim();
    if (val) this.addChip(val);
  }

  focusInput() {
    if (!this.disabled) this.chipInput?.nativeElement.focus();
  }
}
