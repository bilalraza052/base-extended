import { Component, ElementRef, EventEmitter, HostListener, Input, OnChanges, Output, SimpleChanges, ViewChild } from '@angular/core';

export type OslDisplayType = 'date' | 'datetime' | 'time' | 'link' | 'boolean';

export interface OslGridColumn {
  col?:number;
  key: string;
  label: string;
  enums?: { value: any; label: string }[];
  displayFn?: (value: any, row: any) => string;
  /** When true, renders edit + delete icon buttons instead of cell text. */
  isActions?: boolean;
  displayType?: OslDisplayType;
  click?: (row: any, col: any) => void;
}

export interface OslMenuAction {
  label: string;
  labelIf?: (row: any) => string;
  hideIf?: (row: any) => boolean;
  click: (row: any) => void;
}

export interface OslSortEvent {
  key: string;
  asc: boolean;
}

export interface OslPageEvent {
  page: number;
  pageSize: number;
  searchValue?:any;
}

@Component({
  selector: 'osl-grid',
  standalone: false,
  templateUrl: './grid.html',
  styleUrl: './grid.scss',
})
export class OslGrid implements OnChanges {
  @Input('columns') columns: OslGridColumn[] = [];
  @Input('datasource') datasource: any[] = [];
  @Output() datasourceChange = new EventEmitter<any[]>();

  @Input('isPaginated') isPaginated: boolean = false;
  @Input('pageSize') pageSize: number = 25;

  /** When true, component handles sorting/pagination internally.
   *  When false, events fire and the host is responsible for updating datasource. */
  @Input('autoMode') autoMode: boolean = true;

  @Input('totalRecords') totalRecords: number = 0;

  /** Height of the scrollable table body. Defaults to fill remaining viewport.
   *  Pass any valid CSS value: '400px', 'calc(100vh - 200px)', etc. */
  @Input('tableHeight') tableHeight: string = 'calc(100vh - 200px)';

  /** When true, shows skeleton loading rows instead of data. */
  @Input('loading') loading: boolean = false;
  @Input('isSelectable') isSelectable: boolean = false;
  @Input('moreMenuActions') moreMenuActions: OslMenuAction[] = [];
  @Input('canEdit') canEdit: boolean = true;
  @Input('canDelete') canDelete: boolean = true;
  @Input('highlightedRow') highlightedRow: any = null;
  @Input('primaryKey') primaryKey: string = 'id';

  @ViewChild('tableContainer') private _tableContainerRef!: ElementRef<HTMLDivElement>;

  @Output() pageChange = new EventEmitter<OslPageEvent>();
  @Output() pageSizeChange = new EventEmitter<OslPageEvent>();
  @Output() sortChange = new EventEmitter<OslSortEvent>();
  @Output() editClick = new EventEmitter<any>();
  @Output() deleteClick = new EventEmitter<any>();
  @Output() onRowClick = new EventEmitter<any>();

  currentPage = 1;
  sortKey: string = '';
  sortAsc: boolean = true;
  pageSizeOptions = [10, 25, 50, 100];
  openMenuIndex: number | null = null;
  menuPosition = { top: 0, left: 0 };
  private _restorePage: number | null = null;

  @HostListener('document:click')
  onDocumentClick(): void {
    this.openMenuIndex = null;
  }

  toggleMenu(index: number, event: Event): void {
    event.stopPropagation();
    if (this.openMenuIndex === index) {
      this.openMenuIndex = null;
      return;
    }
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const menuWidth = 190;
    const left = Math.min(
      Math.max(rect.right - menuWidth, 8),
      window.innerWidth - menuWidth - 8
    );
    this.menuPosition = { top: rect.bottom + 6, left };
    this.openMenuIndex = index;
  }

  closeMenu(): void {
    this.openMenuIndex = null;
  }

  get skeletonRows(): number[] {
    return Array.from({ length: Math.min(this.pageSize, 10) });
  }

  get skeletonColumns(): number[] {
    return Array.from({ length: 5 });
  }

  get _total(): number {
    return this.autoMode ? this.datasource.length : this.totalRecords;
  }

  get totalPages(): number {
    return Math.ceil(this._total / this.pageSize) || 1;
  }

  get sortedData(): any[] {
    if (!this.autoMode || !this.sortKey) return [...this.datasource];
    return [...this.datasource].sort((a, b) => {
      const va = a[this.sortKey] ?? '';
      const vb = b[this.sortKey] ?? '';
      const cmp = String(va).localeCompare(String(vb), undefined, { numeric: true });
      return this.sortAsc ? cmp : -cmp;
    });
  }

  get pagedData(): any[] {
    if (!this.isPaginated || !this.autoMode) return this.sortedData;
    const start = (this.currentPage - 1) * this.pageSize;
    return this.sortedData.slice(start, start + this.pageSize);
  }

  get pageNumbers(): number[] {
    const total = this.totalPages;
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const pages: number[] = [1];
    if (this.currentPage > 3) pages.push(-1);
    for (let i = Math.max(2, this.currentPage - 1); i <= Math.min(total - 1, this.currentPage + 1); i++) {
      pages.push(i);
    }
    if (this.currentPage < total - 2) pages.push(-1);
    pages.push(total);
    return pages;
  }

  get startRecord(): number {
    if (this._total === 0) return 0;
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  get endRecord(): number {
    return Math.min(this.currentPage * this.pageSize, this._total);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['datasource'] && this.autoMode) {
      this.currentPage = this._restorePage ?? 1;
    }
  }

  setRestorePage(page: number): void {
    this._restorePage = page;
  }

  clearRestorePage(): void {
    this._restorePage = null;
  }

  scrollTo(top: number): void {
    if (this._tableContainerRef) {
      this._tableContainerRef.nativeElement.scrollTop = top;
    }
  }

  getScrollTop(): number {
    return this._tableContainerRef?.nativeElement?.scrollTop ?? 0;
  }

  isHighlightedRow(row: any): boolean {
    if (!this.highlightedRow || !this.primaryKey) return false;
    const val = row[this.primaryKey];
    return val !== undefined && val === this.highlightedRow[this.primaryKey];
  }

  sort(key: string, isActions?: boolean): void {
    if (isActions) return;
    if (this.sortKey === key) {
      this.sortAsc = !this.sortAsc;
    } else {
      this.sortKey = key;
      this.sortAsc = true;
    }
    this.sortChange.emit({ key: this.sortKey, asc: this.sortAsc });
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this._restorePage = null;
    this.currentPage = page;
    this.pageChange.emit({ page: this.currentPage, pageSize: this.pageSize });
  }

  onPageSizeChange(size: number): void {
    this._restorePage = null;
    this.pageSize = Number(size);
    this.currentPage = 1;
    this.pageSizeChange.emit({ page: this.currentPage, pageSize: this.pageSize });
  }

  hasVisibleActions(row: any): boolean {
    return this.moreMenuActions.some(a => !a.hideIf || !a.hideIf(row));
  }

    getActionLabel(action: OslMenuAction, row: any): string {
    return action.labelIf ? action.labelIf(row) : action.label;
  }

  getCellValue(row: any, col: OslGridColumn): string {
    const raw = row[col.key];
    if (col.displayFn) return col.displayFn(raw, row);
    if (col.enums?.length) {
      const match = col.enums.find(e => e.value === raw);
      return match ? match.label : (raw ?? '--');
    }
    return raw !== null && raw !== undefined && raw !== '' ? raw : '--';
  }
}
