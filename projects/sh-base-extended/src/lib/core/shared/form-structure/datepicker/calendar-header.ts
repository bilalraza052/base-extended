import { ChangeDetectionStrategy, ChangeDetectorRef, Component, InjectionToken, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DateAdapter } from '@angular/material/core';
import { MatCalendar } from '@angular/material/datepicker';

/** Implemented by the datepicker that owns the calendar (sh-datepicker). */
export interface ShCalendarHost {
  selectToday(): void;
  clearFromCalendar(): void;
}

export const SH_CALENDAR_HOST = new InjectionToken<ShCalendarHost>('SH_CALENDAR_HOST');

/**
 * HubSpot-style calendar header for MatDatepicker:
 *   [ October 2026 ▾ ]            ‹  ›
 * plus the "Today" / "Clear" pill buttons pinned to the bottom of the calendar.
 * Day clicks are committed immediately (no Apply step).
 */
@Component({
  selector: 'sh-calendar-header',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="sh-cal-head">
      <button type="button" class="sh-cal-label" (click)="toggleView()" [attr.aria-label]="'Change view, ' + label">
        {{ label }} <span class="sh-cal-caret"></span>
      </button>
      <span class="sh-cal-spacer"></span>
      <button type="button" class="sh-cal-nav" (click)="move(-1)" aria-label="Previous">
        <svg viewBox="0 0 16 16"><path d="M10 3.5 5.5 8l4.5 4.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>
      <button type="button" class="sh-cal-nav" (click)="move(1)" aria-label="Next">
        <svg viewBox="0 0 16 16"><path d="M6 3.5 10.5 8 6 12.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>
    </div>
    @if (host) {
      <div class="sh-cal-actions">
        <button type="button" class="sh-cal-btn" (click)="host.selectToday()">Today</button>
        <button type="button" class="sh-cal-btn" (click)="host.clearFromCalendar()">Clear</button>
      </div>
    }
  `,
  styles: `
    :host { display: block; font-family: var(--sh-font-family, "Lexend Deca", Helvetica, Arial, sans-serif); }
    .sh-cal-head { display: flex; align-items: center; gap: 4px; padding: 12px 8px 4px 12px; }
    .sh-cal-spacer { flex: 1; }
    .sh-cal-label {
      display: inline-flex; align-items: center; gap: 8px;
      height: 32px; padding: 0 8px; border: none; border-radius: 6px; background: transparent;
      font: 600 16px/20px var(--sh-font-family, "Lexend Deca", Helvetica, Arial, sans-serif);
      color: var(--sh-text, #333); cursor: pointer;
    }
    .sh-cal-label:hover { background: var(--sh-surface-hover, #f0f0f0); }
    .sh-cal-caret { border-top: 5px solid currentColor; border-left: 5px solid transparent; border-right: 5px solid transparent; }
    .sh-cal-nav {
      display: inline-flex; align-items: center; justify-content: center;
      width: 32px; height: 32px; padding: 0; border: none; border-radius: 50%;
      background: transparent; color: var(--sh-text, #333); cursor: pointer;
    }
    .sh-cal-nav svg { width: 16px; height: 16px; }
    .sh-cal-nav:hover { background: var(--sh-surface-hover, #f0f0f0); }
    /* pinned under the day grid (the calendar reserves the space, see _sh-theme.scss) */
    .sh-cal-actions { position: absolute; left: 16px; right: 16px; bottom: 12px; display: flex; gap: 16px; }
    .sh-cal-btn {
      flex: 1; height: 24px; border: 1px solid var(--sh-border-interactive, #8a8a8a); border-radius: 999999px;
      background: #fff; font: 300 12px/14px var(--sh-font-family, "Lexend Deca", Helvetica, Arial, sans-serif);
      color: var(--sh-text, #333); cursor: pointer;
    }
    .sh-cal-btn:hover { background: var(--sh-secondary-hover, #ebfdfc); }
  `,
})
export class ShCalendarHeader<D> {
  private _calendar = inject<MatCalendar<D>>(MatCalendar);
  private _adapter = inject<DateAdapter<D>>(DateAdapter);
  readonly host = inject(SH_CALENDAR_HOST, { optional: true });

  constructor() {
    const cdr = inject(ChangeDetectorRef);
    this._calendar.stateChanges.pipe(takeUntilDestroyed()).subscribe(() => cdr.markForCheck());
  }

  get label(): string {
    const d = this._calendar.activeDate;
    const year = this._adapter.getYearName(d);
    switch (this._calendar.currentView) {
      case 'month':
        return `${this._adapter.getMonthNames('long')[this._adapter.getMonth(d)]} ${year}`;
      case 'year':
        return year;
      default: {
        const y = this._adapter.getYear(d);
        const start = y - (y % 24);
        return `${start} – ${start + 23}`;
      }
    }
  }

  toggleView(): void {
    this._calendar.currentView = this._calendar.currentView === 'month' ? 'multi-year' : 'month';
  }

  move(dir: 1 | -1): void {
    const d = this._calendar.activeDate;
    const view = this._calendar.currentView;
    this._calendar.activeDate =
      view === 'month' ? this._adapter.addCalendarMonths(d, dir)
      : view === 'year' ? this._adapter.addCalendarYears(d, dir)
      : this._adapter.addCalendarYears(d, dir * 24);
  }
}
