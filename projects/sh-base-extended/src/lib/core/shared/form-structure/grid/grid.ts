import { ChangeDetectorRef, Component, ElementRef, EventEmitter, HostListener, Input, OnChanges, Output, SimpleChanges, ViewChild, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ShEditColumnsData, ShEditColumnsDialog } from '../../components/edit-columns-dialog/edit-columns-dialog';

export type ShDisplayType = 'date' | 'datetime' | 'time' | 'link' | 'customDateFormat' | 'boolean';

export interface ShGridColumn {
  col?:number;
  key: string;
  label: string;
  enums?: { value: any; label: string }[];
  displayFn?: (value: any, row: any) => string;
  /** When true, renders edit + delete icon buttons instead of cell text. */
  isActions?: boolean;
  /** Applies a built-in transform to the cell value. 'date' → dd/MM/yyyy, 'datetime' → dd/MM/yyyy HH:mm, 'time' → HH:mm */
  displayType?: ShDisplayType;
  customDateFormat?:string
  click?:(row:any,col:any)=>void;
  /** Column starts hidden; the user can show it from "Edit columns". */
  hidden?: boolean;
  /** Optional fixed CSS width, e.g. '220px'. */
  width?: string;
}

/** Bulk action shown in the HubSpot-style selection bar when rows are checked. */
export interface ShBulkAction {
  label: string;
  /** Optional inline SVG markup or a Material icon name (when it has no '<'). */
  icon?: string;
  /** Renders the action in the alert colour (e.g. Delete). */
  danger?: boolean;
  hideIf?: (rows: any[]) => boolean;
  click: (rows: any[]) => void | Promise<any>;
}

export interface ShMenuAction {
  label: string;
  labelIf?: (row: any) => string;
  hideIf?: (row: any) => boolean;
  click: (row: any) => void | Promise<any>;
}

export interface ShSortEvent {
  key: string;
  asc: boolean;
}

export interface ShPageEvent {
  page: number;
  pageSize: number;
  searchValue?:any;
  sortKey?:any;
  sortASC?:boolean;
}

@Component({
  selector: 'sh-grid',
  standalone: false,
  templateUrl: './grid.html',
  styleUrl: './grid.scss',
})
export class ShGrid implements OnChanges {
  @Input('columns') columns: ShGridColumn[] = [];
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
  @Input('moreMenuActions') moreMenuActions: ShMenuAction[] = [];
  @Input('canEdit') canEdit: boolean = true;
  @Input('canDelete') canDelete: boolean = true;
  @Input('highlightedRow') highlightedRow: any = null;
  @Input('primaryKey') primaryKey: string = 'id';

  /** When true, prepends a checkbox column keyed by primaryKey. Opt-in — no effect when false. */
  @Input('checkboxSelection') checkboxSelection: boolean = false;
  /** Set of primaryKey values currently checked. Owned by the host, not this component. */
  @Input('selectedRowKeys') selectedRowKeys: Set<any> = new Set();
  @Output() rowCheckToggle = new EventEmitter<{ row: any; checked: boolean }>();
  @Output() selectAllPageToggle = new EventEmitter<{ rows: any[]; checked: boolean }>();

  // ── HubSpot extras ────────────────────────────────────────────
  /** Shows the "+" button in the header that opens the "Edit columns" dialog. */
  @Input('columnChooser') columnChooser: boolean = false;
  /** Persists the chosen columns in localStorage under this key. */
  @Input('stateKey') stateKey: string = '';
  /** Columns that can never be hidden/moved in "Edit columns" (defaults to the first data column). */
  @Input('lockedColumnKeys') lockedColumnKeys: string[] | null = null;
  /** Actions shown in the selection bar when checkboxSelection rows are checked. */
  @Input('bulkActions') bulkActions: ShBulkAction[] = [];
  /** Noun used in "25 records" / "1 record selected". */
  @Input('recordLabel') recordLabel: string = 'record';
  @Input('pageSizeOptions') pageSizeOptions: number[] = [10, 25, 50, 100];
  @Output() columnsChange = new EventEmitter<ShGridColumn[]>();
  @Output() clearSelection = new EventEmitter<void>();

  private _dialog = inject(MatDialog);
  private _sanitizer = inject(DomSanitizer);
  private _iconCache = new Map<string, SafeHtml>();
  /** Ordered keys of visible data columns; null = use column definitions as-is. */
  visibleKeys: string[] | null = null;
  pageSizeMenuOpen = false;
  bulkLoadingIndex: number | null = null;

  @ViewChild('tableContainer') private _tableContainerRef!: ElementRef<HTMLDivElement>;

  constructor(private cd: ChangeDetectorRef) {}

  @Output() pageChange = new EventEmitter<ShPageEvent>();
  @Output() pageSizeChange = new EventEmitter<ShPageEvent>();
  @Output() sortChange = new EventEmitter<ShSortEvent>();
  @Output() editClick = new EventEmitter<any>();
  @Output() deleteClick = new EventEmitter<any>();
  @Output() onRowClick = new EventEmitter<any>();

  currentPage = 1;
  sortKey: string = '';
  sortAsc: boolean = true;
  openMenuIndex: number | null = null;
  menuPosition = { top: 0, left: 0 };
  loadingActionIndex: number | null = null;
  private _restorePage: number | null = null;

  showPageCheckboxHint = false;
  pageCheckboxHintPosition = { top: 0, left: 0 };

  onPageCheckboxMouseEnter(event: Event): void {
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const hintWidth = 190;
    const left = Math.min(
      Math.max(rect.left + rect.width / 2 - hintWidth / 2, 8),
      window.innerWidth - hintWidth - 8
    );
    this.pageCheckboxHintPosition = { top: rect.bottom + 8, left };
    this.showPageCheckboxHint = true;
  }

  onPageCheckboxMouseLeave(): void {
    this.showPageCheckboxHint = false;
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    this.pageSizeMenuOpen = false;
    if (this.loadingActionIndex !== null) return;
    this.openMenuIndex = null;
  }

  // ── Columns (Edit columns) ─────────────────────────────────────
  private get _dataColumns(): ShGridColumn[] {
    return this.columns.filter(c => !c.isActions);
  }

  /** Columns actually rendered: actions column first, then visible data columns in chosen order. */
  get displayColumns(): ShGridColumn[] {
    const actions = this.columns.filter(c => c.isActions);
    const data = this._dataColumns;
    if (!this.visibleKeys) return [...actions, ...data.filter(c => !c.hidden)];
    const byKey = new Map(data.map(c => [c.key, c]));
    const ordered = this.visibleKeys.map(k => byKey.get(k)).filter((c): c is ShGridColumn => !!c);
    return [...actions, ...ordered];
  }

  private get _lockedKeys(): string[] {
    if (this.lockedColumnKeys) return this.lockedColumnKeys;
    const first = this._dataColumns[0];
    return first ? [first.key] : [];
  }

  private get _colStorageKey(): string {
    return this.stateKey ? `sh-grid-cols-${this.stateKey}` : '';
  }

  private _loadColumnState(): void {
    const key = this._colStorageKey;
    if (!key) return;
    try {
      const raw = localStorage.getItem(key);
      const keys = raw ? JSON.parse(raw) : null;
      if (Array.isArray(keys)) {
        const valid = new Set(this._dataColumns.map(c => c.key));
        this.visibleKeys = keys.filter((k: string) => valid.has(k));
      }
    } catch { /* storage unavailable */ }
  }

  openColumnChooser(event?: Event): void {
    event?.stopPropagation();
    const data: ShEditColumnsData = {
      columns: this._dataColumns.map(c => ({ key: c.key, label: c.label })),
      visibleKeys: this.displayColumns.filter(c => !c.isActions).map(c => c.key),
      lockedKeys: this._lockedKeys,
      defaultKeys: this._dataColumns.filter(c => !c.hidden).map(c => c.key),
    };
    this._dialog.open(ShEditColumnsDialog, {
      width: '880px',
      maxWidth: '94vw',
      data,
      autoFocus: false,
      panelClass: 'sh-dialog-panel',
    }).afterClosed().subscribe((keys?: string[]) => {
      if (!keys) return;
      this.visibleKeys = keys;
      const key = this._colStorageKey;
      if (key) { try { localStorage.setItem(key, JSON.stringify(keys)); } catch { /* ignore */ } }
      this.columnsChange.emit(this.displayColumns.filter(c => !c.isActions));
      this.cd.markForCheck();
    });
  }

  // ── Selection bar ──────────────────────────────────────────────
  get selectedCount(): number {
    return this.selectedRowKeys?.size ?? 0;
  }

  get selectedRows(): any[] {
    return (this.datasource ?? []).filter(r => this.selectedRowKeys.has(r[this.primaryKey]));
  }

  get visibleBulkActions(): ShBulkAction[] {
    const rows = this.selectedRows;
    return this.bulkActions.filter(a => !a.hideIf || !a.hideIf(rows));
  }

  isSvgIcon(icon?: string): boolean {
    return !!icon && icon.trim().startsWith('<');
  }

  /** Bulk-action icons are developer-supplied SVG markup, so they are trusted. */
  safeIcon(icon: string): SafeHtml {
    let v = this._iconCache.get(icon);
    if (!v) { v = this._sanitizer.bypassSecurityTrustHtml(icon); this._iconCache.set(icon, v); }
    return v;
  }

  async onBulkAction(action: ShBulkAction, index: number): Promise<void> {
    if (this.bulkLoadingIndex !== null) return;
    this.bulkLoadingIndex = index;
    try {
      await Promise.resolve(action.click(this.selectedRows));
    } finally {
      this.bulkLoadingIndex = null;
      this.cd.markForCheck();
    }
  }

  onClearSelection(): void {
    this.selectedRowKeys?.clear();
    this.clearSelection.emit();
  }

  get recordCountLabel(): string {
    const n = this._total;
    return `${n} ${this._plural(n)}`;
  }

  get selectedLabel(): string {
    const n = this.selectedCount;
    return `${n} ${this._plural(n)} selected`;
  }

  private _plural(n: number): string {
    const l = this.recordLabel || 'record';
    return n === 1 ? l : (l.endsWith('s') ? l : l + 's');
  }

  togglePageSizeMenu(event: Event): void {
    event.stopPropagation();
    this.pageSizeMenuOpen = !this.pageSizeMenuOpen;
  }

  choosePageSize(size: number, event: Event): void {
    event.stopPropagation();
    this.pageSizeMenuOpen = false;
    if (size !== this.pageSize) this.onPageSizeChange(size);
  }

  toggleMenu(index: number, event: Event): void {
    event.stopPropagation();
    if (this.loadingActionIndex !== null) return;
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

  async onActionClick(action: ShMenuAction, row: any, index: number): Promise<void> {
    if (this.loadingActionIndex !== null) return;
    this.loadingActionIndex = index;
    try {
      await Promise.resolve(action.click(row));
    } finally {
      this.loadingActionIndex = null;
      this.closeMenu();
      this.cd.markForCheck();
    }
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
    if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
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
    if ((changes['columns'] || changes['stateKey']) && this.visibleKeys === null) {
      this._loadColumnState();
    }
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

  getActionLabel(action: ShMenuAction, row: any): string {
    return action.labelIf ? action.labelIf(row) : action.label;
  }

  getCellValue(row: any, col: ShGridColumn): string {
    const raw = row[col.key];
    if (col.displayFn) return col.displayFn(raw, row);
    if (col.enums?.length) {
      const match = col.enums.find(e => e.value === raw);
      return match ? match.label : (raw ?? '--');
    }
    return raw !== null && raw !== undefined && raw !== '' ? raw : '--';
  }

  isRowChecked(row: any): boolean {
    return this.selectedRowKeys.has(row[this.primaryKey]);
  }

  get pageAllSelected(): boolean {
    return this.pagedData.length > 0 && this.pagedData.every(r => this.selectedRowKeys.has(r[this.primaryKey]));
  }

  get pageSomeSelected(): boolean {
    return !this.pageAllSelected && this.pagedData.some(r => this.selectedRowKeys.has(r[this.primaryKey]));
  }

  toggleRowCheck(row: any, checked: boolean, event: Event): void {
    event.stopPropagation();
    this.rowCheckToggle.emit({ row, checked });
  }

  toggleSelectPage(checked: boolean): void {
    this.selectAllPageToggle.emit({ rows: this.pagedData, checked });
  }
}
