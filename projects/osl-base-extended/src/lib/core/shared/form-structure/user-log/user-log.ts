import { Component, ElementRef, HostListener, Input } from '@angular/core';

export interface UserLogMeta {
  addLog?: string | null;
  addOn?: string | Date | null;
  editLog?: string | null;
  editOn?: string | Date | null;
}

@Component({
  selector: 'osl-user-log',
  standalone: false,
  templateUrl: './user-log.html',
  styleUrl: './user-log.scss',
})
export class OslUserLog {
  @Input() meta: UserLogMeta = {};
  @Input() mode: 'bar' | 'float' = 'bar';

  isOpen = false;

  constructor(private el: ElementRef) {}

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (this.mode === 'float' && this.isOpen) {
      if (!this.el.nativeElement.contains(event.target)) {
        this.isOpen = false;
      }
    }
  }

  togglePanel() {
    this.isOpen = !this.isOpen;
  }

  formatDate(date: string | Date | null | undefined): string {
    if (!date) return '—';
    const d = new Date(date);
    if (isNaN(d.getTime())) return String(date);
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  getInitials(name: string | null | undefined): string {
    if (!name) return '?';
    return name
      .trim()
      .split(/\s+/)
      .map(n => n[0] ?? '')
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }
  getcleanLog(log:string){
    const raw = log.split('#');
    return raw && raw?.length > 0 ? raw[0] : ""

  }
  get hasData(): boolean {
    return !!(this.meta?.addLog || this.meta?.addOn || this.meta?.editLog || this.meta?.editOn);
  }
}
