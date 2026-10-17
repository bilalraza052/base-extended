import { Component, EventEmitter, Input, Output } from '@angular/core';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'transparent'
  | 'link'
  | 'success'
  | 'danger'
  | 'warning'
  | 'info'
  | 'outline-primary'
  | 'outline-secondary'
  | 'outline-success'
  | 'outline-danger'
  | 'outline-warning'
  | 'outline-info'
  | 'icon'

export type ButtonSize = 'sm' | 'md' | 'lg';

/**
 * HubSpot-style pill button.
 *  primary   → dark teal (#00494b) "Create"
 *  secondary → white with #8a8a8a border "Cancel"
 *  transparent / link → text-only buttons used in toolbars and bulk-action bars
 *  icon      → 32px circular outline icon button
 * Sizes: sm = 32px toolbar button (12px), md = 40px (14px/600), lg = 48px.
 */
@Component({
  selector: 'sh-button',
  standalone: false,
  templateUrl: './button.html',
  styleUrl: './button.scss',
})
export class ShButton {
  @Input('label') label: string = 'Button';
  @Input('icon') icon: string = '';
  /** Where the Material icon is drawn relative to the label. */
  @Input('iconPosition') iconPosition: 'before' | 'after' = 'after';
  /** Adds a small dropdown caret after the label (e.g. "Add contacts ▾"). */
  @Input('caret') caret: boolean = false;
  @Input('variant') variant: ButtonVariant = 'primary';
  @Input('size') size: ButtonSize = 'md';
  @Input('disabled') disabled: boolean = false;
  @Input('loading') loading: boolean = false;
  @Input('type') type: 'button' | 'submit' | 'reset' = 'button';
  @Input('fullWidth') fullWidth: boolean = false;
  /** Tooltip / accessible label (used by the icon variant). */
  @Input('tooltip') tooltip: string = '';
  @Output() clickEv = new EventEmitter<void>();

  get classes(): string {
    return [
      'sh-btn',
      `sh-btn--${this.variant}`,
      `sh-btn--${this.size}`,
      this.fullWidth ? 'sh-btn--full' : '',
      this.loading ? 'sh-btn--loading' : '',
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
