import { Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { InputType } from '../input/input';

/** 'raw' = string[] model, 'commaSeparated' = single comma separated string model. */
export type ChipsReturnType = 'raw' | 'commaSeparated';

@Component({
  selector: 'sh-chips-input',
  standalone: false,
  templateUrl: './chips-input.html',
  styleUrl: './chips-input.scss',
})
export class ShChipsInput {
  @Input('label') label: string = '';
  @Input('required') required: boolean = false;
  @Input('disabled') disabled: boolean = false;
  @Input('model') model: string[] | string | null = [];
  @Input('placeholder') placeholder: string = 'Type and press Enter...';
  /** Each chip is validated against this type before it is added (email, number, int, url). */
  @Input('inputType') inputType: InputType = 'text';
  @Input('returnType') returnType: ChipsReturnType = 'raw';
  @Input('skeletonLoading') skeletonLoading: boolean = false;
  @Input('skeletonTheme') skeletonTheme: 'light' | 'dark' = 'light';

  @Output() modelChange = new EventEmitter<string[] | string>();
  @Output() changeEv = new EventEmitter<string[] | string>();

  @ViewChild('chipInput') chipInput: ElementRef<HTMLInputElement> | undefined;

  inputValue: string = '';
  touched: boolean = false;
  /** Validation message for the text currently typed (not yet a chip). */
  inputError: string = '';

  get isRequiredInvalid(): boolean {
    return this.touched && this.required && this.chips.length === 0;
  }

  get isInvalid(): boolean {
    return this.isRequiredInvalid || !!this.inputError;
  }

  /** Accepts both model shapes regardless of returnType, so existing data always renders. */
  get chips(): string[] {
    if (Array.isArray(this.model)) return this.model;
    if (typeof this.model === 'string') return this.splitValues(this.model);
    return [];
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
    // Pasted text may carry several comma separated values.
    const values = this.splitValues(value);
    if (!values.length) return;

    const invalid = values.find(v => !this.isValidValue(v));
    if (invalid !== undefined) {
      // Keep the typed text so the user can correct it.
      this.inputError = this.validationMessage;
      return;
    }

    const next = [...this.chips];
    for (const v of values) {
      if (!next.includes(v)) next.push(v);
    }
    if (next.length !== this.chips.length) this.emit(next);

    this.inputError = '';
    this.inputValue = '';
    // Reset the DOM value since [value] binding won't fire if already ''
    if (this.chipInput) this.chipInput.nativeElement.value = '';
  }

  // preventDefault on the mousedown event keeps focus on the text input,
  // preventing blur → onBlur → auto-commit of partially typed text.
  removeChip(index: number, event?: Event) {
    event?.preventDefault();
    this.emit(this.chips.filter((_, i) => i !== index));
  }

  onInput(val: string) {
    this.inputValue = val;
    this.inputError = '';
  }

  onBlur() {
    this.touched = true;
    const val = this.inputValue.trim();
    if (val) this.addChip(val);
  }

  focusInput() {
    if (!this.disabled) this.chipInput?.nativeElement.focus();
  }

  private emit(chips: string[]) {
    this.model = this.returnType === 'commaSeparated' ? chips.join(',') : chips;
    this.modelChange.emit(this.model);
    this.changeEv.emit(this.model);
  }

  private splitValues(value: string): string[] {
    return value.split(',').map(v => v.trim()).filter(v => !!v);
  }

  private isValidValue(value: string): boolean {
    switch (this.inputType) {
      case 'email':
        // Same pattern as baseComponent's save-time validation, so an accepted chip never fails on save.
        return /^(?!.*\.\.)(?!.*\.$)[A-Za-z0-9][A-Za-z0-9._%+-]{0,63}@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/.test(value);
      case 'number':
        return /^-?\d+(\.\d+)?$/.test(value);
      case 'int':
        return /^-?\d+$/.test(value);
      case 'url':
        try {
          new URL(value);
          return true;
        } catch {
          return false;
        }
      default:
        return true;
    }
  }

  private get validationMessage(): string {
    switch (this.inputType) {
      case 'email': return 'Please enter a valid email address.';
      case 'number': return 'Please enter a valid number.';
      case 'int': return 'Please enter a whole number.';
      case 'url': return 'Please enter a valid URL.';
      default: return 'Invalid value.';
    }
  }
}
