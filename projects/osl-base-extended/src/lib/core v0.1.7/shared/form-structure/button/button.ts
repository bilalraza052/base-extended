import { Component, EventEmitter, Input, Output } from '@angular/core';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'success'
  | 'danger'
  | 'warning'
  | 'info'
  | 'outline-primary'
  | 'outline-secondary'
  | 'outline-success'
  | 'outline-danger'
  | 'outline-warning'
  | 'outline-info';

export type ButtonSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'osl-button',
  standalone: false,
  templateUrl: './button.html',
  styleUrl: './button.scss',
})
export class OslButton {
  @Input('label') label: string = 'Button';
  @Input('icon') icon: string = '';
  @Input('variant') variant: ButtonVariant = 'primary';
  @Input('size') size: ButtonSize = 'md';
  @Input('disabled') disabled: boolean = false;
  @Input('loading') loading: boolean = false;
  @Input('type') type: 'button' | 'submit' | 'reset' = 'button';
  @Input('fullWidth') fullWidth: boolean = false;
  @Output() clickEv = new EventEmitter<void>();

  get classes(): string {
    return [
      'osl-btn',
      `osl-btn--${this.variant}`,
      `osl-btn--${this.size}`,
      this.fullWidth ? 'osl-btn--full' : '',
    ]
      .filter(Boolean)
      .join(' ');
  }

  onClick() {
    if (!this.disabled && !this.loading) {
      this.clickEv.emit();
    }
  }
}
