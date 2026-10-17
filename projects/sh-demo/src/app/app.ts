import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
  <header class="demo-top">
    <span class="demo-logo">sh</span>
    <div class="demo-search">Search sh-base-extended</div>
    <span class="demo-top__spacer"></span>
    <span class="demo-user"><span class="demo-avatar">BR</span> Bilal Raza</span>
  </header>
  <nav class="demo-nav">
    <a routerLink="/contacts" routerLinkActive="is-active">
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="2.5" y="2" width="11" height="12" rx="1.5"/><circle cx="8" cy="6.5" r="2"/><path d="M4.8 11.5c.6-1.5 1.8-2.3 3.2-2.3s2.6.8 3.2 2.3"/></svg>
      Contacts
    </a>
    <a routerLink="/forms" routerLinkActive="is-active">
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="2.5" y="2" width="11" height="12" rx="1.5"/><path d="M5 5.5h6M5 8h6M5 10.5h3.5"/></svg>
      Form fields
    </a>
    <a routerLink="/dialogs" routerLinkActive="is-active">
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="1.8" y="3" width="12.4" height="10" rx="1.5"/><path d="M1.8 6h12.4"/></svg>
      Dialogs &amp; panels
    </a>
    <a routerLink="/more" routerLinkActive="is-active">
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="2" y="2" width="5" height="5" rx="1"/><rect x="9" y="2" width="5" height="5" rx="1"/><rect x="2" y="9" width="5" height="5" rx="1"/><rect x="9" y="9" width="5" height="5" rx="1"/></svg>
      All components (osl example)
    </a>
  </nav>
  <main class="demo-main"><router-outlet /></main>
  `,
  styles: `
  :host { display: block; min-height: 100vh; background: #f0f0f0; }
  .demo-top { position: fixed; inset: 0 0 auto 0; height: 44px; display: flex; align-items: center; gap: 16px; padding: 0 16px; background: #333; color: #fff; z-index: 10; font-size: 14px; font-weight: 600; }
  .demo-logo { width: 24px; height: 24px; display: grid; place-items: center; border-radius: 6px; background: #ff4800; color: #fff; font-size: 12px; }
  .demo-search { margin-left: 200px; width: 416px; height: 32px; display: flex; align-items: center; padding: 0 16px; border-radius: 999px; border: 1px solid #8a8a8a; color: #fff; font-weight: 300; }
  .demo-top__spacer { flex: 1; }
  .demo-user { display: flex; align-items: center; gap: 8px; }
  .demo-avatar { width: 24px; height: 24px; border-radius: 50%; background: #e0fcfa; color: #00494b; display: grid; place-items: center; font-size: 10px; }
  .demo-nav { position: fixed; top: 44px; bottom: 0; left: 0; width: 236px; background: #333; padding: 12px 8px; display: flex; flex-direction: column; gap: 2px; }
  .demo-nav a { display: flex; align-items: center; gap: 12px; height: 34px; padding: 0 16px; border-radius: 999px; color: #fff; text-decoration: none; font-size: 14px; font-weight: 600; }
  .demo-nav a svg { width: 16px; height: 16px; }
  .demo-nav a:hover { background: #4d4d4d; }
  .demo-nav a.is-active { background: #666; }
  .demo-main { margin-left: 236px; padding: 60px 16px 16px; }
  `,
})
export class App {}
