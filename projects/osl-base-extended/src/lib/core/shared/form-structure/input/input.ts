import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';

export type InputType = 'text' | 'password' | 'email' | 'number' | 'tel' | 'url' | 'int';

@Component({
  selector: 'osl-input',
  standalone: false,
  templateUrl: './input.html',
  styleUrl: './input.scss',
})
export class Oslinput implements OnInit, OnChanges {
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
  @Input('onlyChars') onlyChars: boolean = false;
  @Input('isCapitalize') isCapitalize: boolean = false;
  /** Enforce N decimal places. Shows 0.00 when blank; auto-pads on blur. */
  @Input('decimalPortion') decimalPortion: number | null = null;

  @Output() modelChange = new EventEmitter<any>();
  @Output() changeEv = new EventEmitter<any>();

  showPassword = false;
  isFocused = false;

  get inputType(): string {
    if (this.type === 'password') return this.showPassword ? 'text' : 'password';
    if (this.decimalPortion !== null || this.type === 'int') return 'text';
    return this.type;
  }

  get hasWrapper(): boolean {
    return !!(this.prefixIcon || this.suffixIcon || this.type === 'password');
  }

  ngOnInit() {
    if (this.decimalPortion !== null) {
      this.applyDecimalFormat();
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['model'] && !changes['model'].firstChange && this.decimalPortion !== null && !this.isFocused) {
      this.applyDecimalFormat();
    }
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  onFocusIn(event: FocusEvent) {
    this.isFocused = true;
    if (this.decimalPortion !== null) {
      setTimeout(() => (event.target as HTMLInputElement).select(), 0);
    }
  }

  onFocusOut() {
    this.isFocused = false;
    if (this.decimalPortion !== null) {
      const raw = String(this.model ?? '');
      const formatted = raw ? this.formatDecimal(raw) : (0).toFixed(this.decimalPortion);
      this.model = formatted;
      this.modelChange.emit(this.model);
      this.changeEv.emit(this.model);
    }
  }

  private applyDecimalFormat() {
    const raw = this.model == null || this.model === '' ? '' : String(this.model);
    const formatted = raw ? this.formatDecimal(raw) : (0).toFixed(this.decimalPortion!);
    if (formatted !== String(this.model ?? '')) {
      this.model = formatted;
      this.modelChange.emit(this.model);
    }
  }

  private formatDecimal(value: string): string {
    const cleaned = value.replace(/[^\d.]/g, '');
    const num = parseFloat(cleaned);
    if (isNaN(num)) return (0).toFixed(this.decimalPortion!);
    return num.toFixed(this.decimalPortion!);
  }

  private cleanDecimalInput(value: string): string {
    let cleaned = value.replace(/[^\d.]/g, '');
    const parts = cleaned.split('.');
    if (parts.length > 2) {
      cleaned = parts[0] + '.' + parts.slice(1).join('');
    }
    if (parts.length >= 2 && parts[1].length > this.decimalPortion!) {
      cleaned = parts[0] + '.' + parts[1].substring(0, this.decimalPortion!);
    }
    return cleaned;
  }

  onKeyDown(event: KeyboardEvent) {
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    if (event.key.length !== 1) return;

    if (this.onlyChars && /\d/.test(event.key)) {
      event.preventDefault();
      return;
    }

    if (this.type === 'int') {
      if (!/\d/.test(event.key)) {
        event.preventDefault();
      }
      return;
    }

    if (this.decimalPortion !== null) {
      const key = event.key;
      if (!/[\d.]/.test(key)) {
        event.preventDefault();
        return;
      }
      if (key === '.' && (this.decimalPortion === 0 || String(this.model ?? '').includes('.'))) {
        event.preventDefault();
        return;
      }
      if (/\d/.test(key)) {
        const input = event.target as HTMLInputElement;
        const val = input.value;
        const dotIndex = val.indexOf('.');
        if (dotIndex !== -1) {
          const selStart = input.selectionStart ?? val.length;
          const selEnd = input.selectionEnd ?? selStart;
          if (selStart > dotIndex) {
            const afterDotStart = dotIndex + 1;
            const afterDotLen = val.length - afterDotStart;
            const selInAfterDotStart = Math.max(selStart, afterDotStart);
            const selInAfterDotEnd = Math.max(selEnd, afterDotStart);
            const selectedInAfterDot = selInAfterDotEnd - selInAfterDotStart;
            const remainingDecimals = afterDotLen - selectedInAfterDot;
            if (remainingDecimals >= this.decimalPortion!) {
              event.preventDefault();
              return;
            }
          }
        }
      }
      return;
    }

    if (this.mask && !this.isKeyAllowedByMask(event.key)) {
      event.preventDefault();
    }
  }

  private isKeyAllowedByMask(key: string): boolean {
    const maskSlots = new Set<string>();
    for (const c of this.mask) {
      if (c === '0') maskSlots.add('digit');
      else if (c === 'A') maskSlots.add('letter');
      else if (c === '*') maskSlots.add('any');
    }
    if (maskSlots.has('any')) return true;
    if (maskSlots.has('letter') && /[a-zA-Z]/.test(key)) return true;
    if (maskSlots.has('digit') && /\d/.test(key)) return true;
    return false;
  }

  onModelChange(value: string) {
    if (this.decimalPortion !== null) {
      const cleaned = this.cleanDecimalInput(value);
      this.model = cleaned;
      this.modelChange.emit(this.model);
      return;
    }
    if (this.type === 'int') {
      const dotIndex = value.indexOf('.');
      const truncated = dotIndex !== -1 ? value.substring(0, dotIndex) : value;
      const digits = truncated.replace(/[^\d]/g, '');
      this.model = digits === '' ? null : parseInt(digits, 10);
      this.modelChange.emit(this.model);
      return;
    }
    if (this.type === 'number') {
      this.model = value === '' ? null : value;
      this.modelChange.emit(this.model);
      return;
    }
    if(this.isCapitalize){
      value = typeof value == 'string' ? value?.toUpperCase() : value
    }
    const processed = this.mask ? this.applyMask(value) : value;
    this.model = processed;
    this.modelChange.emit(this.model);
  }

  onChange() {
    if (this.decimalPortion !== null) return;
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
