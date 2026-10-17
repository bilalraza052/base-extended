import { Component, ElementRef, EventEmitter, HostListener, Input, OnInit, Output, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'sh-searchbar',
  standalone: false,
  templateUrl: './searchbar.html',
  styleUrl: './searchbar.scss',
})
export class ShSearchbar implements OnInit {
  /** Placeholder text. HubSpot style: "Search". The shortcut hint is appended automatically. */
  @Input('label') label: string = 'Search';
  /** Keyboard shortcut that focuses the search box from anywhere on the page (HubSpot uses "/"). Empty string disables it. */
  @Input('shortcutKey') shortcutKey: string = '/';
  /** Debounce in ms before onSearch fires. */
  @Input('debounce') debounce: number = 300;
  @Output() onSearch = new EventEmitter<any>();

  @ViewChild('searchInput') searchInput?: ElementRef<HTMLInputElement>;

  searchQuery: string = '';
  focused = false;
  searchControl = new FormControl('');

  get placeholderText(): string {
    return this.shortcutKey ? `${this.label} ( ${this.shortcutKey} )` : this.label;
  }

  @HostListener('document:keydown', ['$event'])
  onDocumentKeydown(event: KeyboardEvent): void {
    if (!this.shortcutKey || event.key !== this.shortcutKey) return;
    const target = event.target as HTMLElement | null;
    const tag = target?.tagName?.toLowerCase();
    if (tag === 'input' || tag === 'textarea' || tag === 'select' || target?.isContentEditable) return;
    event.preventDefault();
    this.focus();
  }

  focus(): void {
    this.searchInput?.nativeElement.focus();
  }

  onKeyChange() {
    if (!this.searchQuery) {
      this.onSearch.emit(this.searchQuery);
    }
  }

  onEscape() {
    if (this.searchQuery) {
      this.clearSearch();
    } else {
      this.searchInput?.nativeElement.blur();
    }
  }

  clearSearch() {
    this.searchQuery = '';
    this.searchControl.setValue('', { emitEvent: false });
    this.onSearch.emit('');
  }

  ngOnInit() {
    this.searchControl.valueChanges.pipe(
      debounceTime(this.debounce),
      distinctUntilChanged()
    ).subscribe(value => {
      if (value) {
        this.onSearch.emit(value);
      }
    });
  }
}
