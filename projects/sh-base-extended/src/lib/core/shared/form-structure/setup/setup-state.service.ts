import { Injectable } from '@angular/core';

export interface ShSetupState {
  page: number;
  pageSize: number;
  searchValue: string;
  scrollTop: number;
  highlightedRow: any;
}

@Injectable({ providedIn: 'root' })
export class ShSetupStateService {
  private _map = new Map<string, ShSetupState>();

  save(key: string, state: ShSetupState): void {
    this._map.set(key, state);
  }

  consume(key: string): ShSetupState | undefined {
    const state = this._map.get(key);
    if (state) this._map.delete(key);
    return state;
  }
}
