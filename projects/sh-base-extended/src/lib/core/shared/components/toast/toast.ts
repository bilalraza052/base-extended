import { Component, Inject } from '@angular/core';
import { MAT_SNACK_BAR_DATA, MatSnackBarRef } from '@angular/material/snack-bar';

export type ShToastKind = 'success' | 'error' | 'warning' | 'info';

export interface ShToastData {
  kind: ShToastKind;
  message: string;
  title?: string;
}

const DEFAULT_TITLES: Record<ShToastKind, string> = {
  success: 'Success.',
  error: 'Error.',
  warning: 'Warning.',
  info: 'Info.',
};

/** HubSpot "FloatingAlert" look – tinted card, bold title + message inline, close ✕ top-right. */
@Component({
  selector: 'sh-toast',
  standalone: true,
  template: `
    <div class="sh-toast-card sh-toast-card--{{ data.kind }}" role="alert">
      <div class="sh-toast-card__content">
        <h5 class="sh-toast-card__title">{{ title }}</h5>
        <div class="sh-toast-card__message">{{ data.message }}</div>
      </div>
      <button type="button" class="sh-toast-card__close" aria-label="Close" (click)="snackRef.dismiss()">
        <svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true">
          <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" fill="none"/>
        </svg>
      </button>
    </div>
  `,
  styleUrl: './toast.scss',
})
export class ShToast {
  constructor(
    public snackRef: MatSnackBarRef<ShToast>,
    @Inject(MAT_SNACK_BAR_DATA) public data: ShToastData
  ) {}

  get title(): string {
    return this.data.title ?? DEFAULT_TITLES[this.data.kind];
  }
}
