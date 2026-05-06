import { Component, EventEmitter, Input, Output } from '@angular/core';

export type InputType = 'text' | 'password' | 'email' | 'number' | 'tel' | 'url';

@Component({
  selector: 'osl-input',
  standalone: false,
  templateUrl: './input.html',
  styleUrl: './input.scss',
})
export class Oslinput {
  @Input('label') label: string = '';
  @Input('required') required: boolean = false;
  @Input('disabled') disabled: boolean = false;
  @Input('model') model: any = '';
  @Input('type') type: InputType = 'text';
  @Input('placeholder') placeholder: string = '';
  /** Mask pattern: 0=digit, A=letter, *=alphanumeric, other chars are literals. E.g. '(000) 000-0000' */
  @Input('mask') mask: string = '';
  @Input('min') min: string | number = '';
  @Input('max') max: string | number = '';
  @Input('minLength') minLength: number | null = null;
  @Input('maxLength') maxLength: number | null = null;
  @Input('prefixIcon') prefixIcon: string = '';
  @Input('suffixIcon') suffixIcon: string = '';
  @Input('skeletonLoading') skeletonLoading: boolean = false;
  @Input('skeletonTheme') skeletonTheme: 'light' | 'dark' = 'light';

  @Output() modelChange = new EventEmitter<any>();
  @Output() changeEv = new EventEmitter<any>();

  showPassword = false;

  get inputType(): string {
    if (this.type === 'password') return this.showPassword ? 'text' : 'password';
    return this.type;
  }

  get hasWrapper(): boolean {
    return !!(this.prefixIcon || this.suffixIcon || this.type === 'password');
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  onModelChange(value: string) {
    const processed = this.mask ? this.applyMask(value) : value;
    this.model = processed;
    this.modelChange.emit(this.model);
  }

  onChange() {
    this.changeEv.emit(this.model);
  }

  private applyMask(value: string): string {
    if (!this.mask || !value) return value;
    const stripped = value.replace(/[^a-zA-Z0-9]/g, '');
    let result = '';
    let si = 0;

    for (let mi = 0; mi < this.mask.length; mi++) {
      if (si >= stripped.length) break;
      const mc = this.mask[mi];

      if (mc === '0') {
        if (/\d/.test(stripped[si])) result += stripped[si];
        si++;
      } else if (mc === 'A') {
        if (/[a-zA-Z]/.test(stripped[si])) result += stripped[si];
        si++;
      } else if (mc === '*') {
        result += stripped[si++];
      } else {
        result += mc;
      }
    }
    return result;
  }
}
