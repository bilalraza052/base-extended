import { Injectable } from '@angular/core';

export interface OslSetupState {
  page: number;
  pageSize: number;
  searchValue: string;
  scrollTop: number;
  highlightedRow: any;
}

@Injectable({ providedIn: 'root' })
export class OslSetupStateService {
  private _map = new Map<string, OslSetupState>();

  save(key: string, state: OslSetupState): void {
    this._map.set(key, state);
  }

  consume(key: string): OslSetupState | undefined {
    const state = this._map.get(key);
    if (state) this._map.delete(key);
    return state;
  }
}
