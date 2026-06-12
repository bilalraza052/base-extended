import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { DirtyStateService } from './core/services/dirty-state.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('osl-core');
  private dirtyState = inject(DirtyStateService);

  get isDirty(): boolean {
    return this.dirtyState.isDirty;
  }
}
