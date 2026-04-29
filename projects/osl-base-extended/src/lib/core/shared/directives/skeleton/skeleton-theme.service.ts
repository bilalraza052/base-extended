import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { SkeletonTheme } from './skeleton.directive';

@Injectable({ providedIn: 'root' })
export class OslSkeletonThemeService {
  private readonly _theme$ = new BehaviorSubject<SkeletonTheme>('light');

  /** Subscribe to react to global theme changes */
  readonly theme$ = this._theme$.asObservable();

  get current(): SkeletonTheme {
    return this._theme$.getValue();
  }

  setTheme(theme: SkeletonTheme): void {
    this._theme$.next(theme);
  }
}
