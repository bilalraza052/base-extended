import {
  Component, Input, Output, EventEmitter, OnChanges, SimpleChanges,
  HostListener, ElementRef, ViewChild, ChangeDetectorRef, ChangeDetectionStrategy, inject
} from '@angular/core';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { DatePipe, DecimalPipe } from '@angular/common';

// ─── Public interfaces ────────────────────────────────────────────────────────

export interface OslReportColumn {
  key: string;
  label: string;
  width?: number;
  minWidth?: number;
  pinned?: boolean;
  sortable?: boolean;
  filterable?: boolean;
  searchable?: boolean;
  groupable?: boolean;
  resizable?: boolean;
  hidden?: boolean;
  displayFn?: (value: any, row: any) => string;
  cellClass?: string | ((value: any, row: any) => string);
  align?: 'left' | 'center' | 'right';
  aggregate?: 'sum' | 'avg' | 'count' | 'min' | 'max';
  displayType?: 'date' | 'datetime' | 'time' | 'currency' | 'number' | 'percentage';
  enums?: { value: any; label: string }[];
  /** Optional group label shown in the top header row (double header). Consecutive columns sharing the same label are merged into one spanning cell. */
  headerGroup?: string;
  /** When true, this column's values are summed in PDF/Excel exports (subtotal per group + grand total). */
  sumOnPdf?: boolean;
}

export interface OslReportPageEvent { page: number; pageSize: number; }
export interface OslReportSortEvent { sorts: { key: string; asc: boolean }[]; }

export interface OslPdfConfig {
  /** Base64 or URL of logo image shown top-left of PDF header. */
  logo?: string;
  /** Company name displayed centered in PDF header. */
  companyName?: string;
  /** Company address line displayed under company name. */
  companyAddress?: string;
  /** Report name rendered between two full-width horizontal lines, centered. */
  reportName?: string;
  /** Page orientation (default: landscape). */
  orientation?: 'portrait' | 'landscape';
  /** Show alternating row background colors (default: false — clean white). */
  alternatingRows?: boolean;
}

// ─── Internal types ───────────────────────────────────────────────────────────

export interface InternalColumn extends OslReportColumn {
  _width: number;
  _hidden: boolean;
  _pinned: boolean;
  _stickyLeft: number;
}

export type FlatRow =
  | { _type: 'data'; _data: any; _rowIndex: number }
  | { _type: 'group'; _key: string; _value: any; _label: string; _colLabel: string; _level: number; _count: number; _expanded: boolean; _path: string };

interface SortState { key: string; asc: boolean; index: number; }

interface ExcelFilterState {
  allItems: { value: any; label: string; checked: boolean }[];
  search: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

@Component({
  selector: 'osl-report-grid',
  standalone: false,
  templateUrl: './report-grid.html',
  styleUrl: './report-grid.scss',
  providers: [DatePipe, DecimalPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OslReportGrid implements OnChanges {

  // Inputs
  @Input() columns: OslReportColumn[] = [];
  @Input() datasource: any[] = [];
  @Input() loading = false;
  @Input() totalRecords = 0;
  @Input() autoMode = true;
  @Input() isPaginated = true;
  @Input() pageSize = 50;
  @Input() tableHeight = 'calc(100vh - 220px)';
  @Input() striped = true;
  @Input() exportable = true;
  @Input() rowHeight = 40;
  @Input() rowSelection: 'single' | 'multiple' | null = null;
  @Input() showAggregates = false;
  @Input() title = '';
  @Input() pdfExportFromGrid = false;
  @Input() pdfConfig: OslPdfConfig = {};

  // Outputs
  @Output() pageChange = new EventEmitter<OslReportPageEvent>();
  @Output() pageSizeChange = new EventEmitter<OslReportPageEvent>();
  @Output() sortChange = new EventEmitter<OslReportSortEvent>();
  @Output() rowClick = new EventEmitter<any>();
  @Output() selectionChange = new EventEmitter<any[]>();

  @ViewChild('headerScrollRef') headerScrollRef!: ElementRef<HTMLDivElement>;
  @ViewChild('bodyScrollRef') bodyScrollRef!: ElementRef<HTMLDivElement>;

  private cdr = inject(ChangeDetectorRef);
  private datePipe = inject(DatePipe);
  private decimalPipe = inject(DecimalPipe);

  // ── Column state ─────────────────────────────────────────────────────────────

  _cols: InternalColumn[] = [];
  _visibleCols: InternalColumn[] = [];
  _totalWidth = 0;

  get visibleCols(): InternalColumn[] { return this._visibleCols; }
  get totalWidth(): number { return this._totalWidth; }

  get pinnedWidth(): number {
    return this._visibleCols.filter(c => c._pinned).reduce((s, c) => s + c._width, 0);
  }

  get hasHeaderGroups(): boolean {
    return this._visibleCols.some(c => !!c.headerGroup);
  }

  get computedHeaderGroups(): { label: string; width: number; isPinned: boolean; stickyLeft: number }[] {
    const result: { label: string; width: number; isPinned: boolean; stickyLeft: number }[] = [];
    for (const col of this._visibleCols) {
      const label = col.headerGroup ?? '';
      const last = result[result.length - 1];
      if (last && last.label === label && last.isPinned === col._pinned) {
        last.width += col._width;
      } else {
        result.push({ label, width: col._width, isPinned: col._pinned, stickyLeft: col._pinned ? col._stickyLeft : 0 });
      }
    }
    return result;
  }

  private updateVisibleCols(): void {
    this._visibleCols = this._cols.filter(c => !c._hidden);
    this._totalWidth = this._visibleCols.reduce((s, c) => s + c._width, 0)
      + (this.rowSelection === 'multiple' ? 36 : 0);
  }

  // ── Sort state ────────────────────────────────────────────────────────────────

  sortStates = new Map<string, SortState>();
  public sortCounter = 0;

  // ── Filter / Search state ─────────────────────────────────────────────────────

  globalSearch = '';
  columnSearch: { [key: string]: string } = {};
  excelFilters: { [key: string]: Set<any> } = {};
  excelFilterState: { [key: string]: ExcelFilterState } = {};
  openFilterKey: string | null = null;
  filterDropdownPos = { top: 0, left: 0 };

  // ── Group state ───────────────────────────────────────────────────────────────

  activeGroups: string[] = [];
  collapsedPaths = new Set<string>();
  showGroupPanel = true;

  // ── Flat rows (computed) ──────────────────────────────────────────────────────

  flatRows: FlatRow[] = [];
  _filteredTotal = 0;

  // ── Pagination ────────────────────────────────────────────────────────────────

  currentPage = 1;
  pageSizeOptions = [25, 50, 100, 200, 500];

  // ── UI state ──────────────────────────────────────────────────────────────────

  showColumnConfig = false;
  selectedRows = new Set<any>();
  columnMenuKey: string | null = null;
  columnMenuPos = { top: 0, left: 0 };
  copiedCell: string | null = null;
  resizing: { key: string; startX: number; startWidth: number } | null = null;

  private _suppressNextHeaderClick = false;
  private _columnDragJustEnded = false;

  // ─── Lifecycle ────────────────────────────────────────────────────────────────

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['columns']) {
      this.initColumns();
      this.excelFilterState = {};
    }
    if (changes['datasource'] || changes['columns']) {
      this.currentPage = 1;
      this.processData();
    }
  }

  private initColumns(): void {
    this._cols = this.columns.map(col => ({
      ...col,
      _width: col.width ?? 150,
      _hidden: col.hidden ?? false,
      _pinned: col.pinned ?? false,
      _stickyLeft: 0,
      sortable: col.sortable !== false,
      filterable: col.filterable !== false,
      searchable: col.searchable !== false,
      groupable: col.groupable !== false,
      resizable: col.resizable !== false,
      minWidth: col.minWidth ?? 60,
      align: col.align ?? 'left',
    }));
    this.recomputePinnedOffsets();
    this.updateVisibleCols();
  }

  recomputePinnedOffsets(): void {
    let offset = this.rowSelection === 'multiple' ? 36 : 0;
    for (const col of this._cols) {
      if (!col._hidden && col._pinned) {
        col._stickyLeft = offset;
        offset += col._width;
      }
    }
  }

  // ─── Data pipeline ────────────────────────────────────────────────────────────

  private getFilteredRows(): any[] {
    let rows = [...this.datasource];

    if (this.globalSearch.trim()) {
      const term = this.globalSearch.toLowerCase();
      rows = rows.filter(row =>
        this.visibleCols.some(col => String(this.getCellDisplay(row, col)).toLowerCase().includes(term))
      );
    }

    for (const col of this._cols) {
      const term = (this.columnSearch[col.key] ?? '').trim().toLowerCase();
      if (term) {
        rows = rows.filter(row => String(this.getCellDisplay(row, col)).toLowerCase().includes(term));
      }
    }

    for (const [key, activeSet] of Object.entries(this.excelFilters)) {
      if (activeSet.size > 0) {
        rows = rows.filter(row => activeSet.has(row[key]));
      }
    }

    return rows;
  }

  private getSortedFilteredRows(): any[] {
    let rows = this.getFilteredRows();
    if (this.autoMode && this.sortStates.size > 0) {
      const sorts = [...this.sortStates.values()].sort((a, b) => a.index - b.index);
      rows.sort((a, b) => {
        for (const s of sorts) {
          const cmp = String(a[s.key] ?? '').localeCompare(String(b[s.key] ?? ''), undefined, { numeric: true });
          if (cmp !== 0) return s.asc ? cmp : -cmp;
        }
        return 0;
      });
    }
    return rows;
  }

  processData(): void {
    const rows = this.getSortedFilteredRows();
    this._filteredTotal = rows.length;

    if (this.activeGroups.length > 0) {
      // Group ALL filtered rows first, then paginate the flat list so every
      // group is computed across the full dataset, not just one page's slice.
      const allGrouped = this.flattenGroups(rows, this.activeGroups, 0, '');
      if (this.isPaginated && this.autoMode) {
        const start = (this.currentPage - 1) * this.pageSize;
        this.flatRows = allGrouped.slice(start, start + this.pageSize);
      } else {
        this.flatRows = allGrouped;
      }
    } else if (this.isPaginated && this.autoMode) {
      const start = (this.currentPage - 1) * this.pageSize;
      this.flatRows = rows.slice(start, start + this.pageSize)
        .map((r, i) => ({ _type: 'data', _data: r, _rowIndex: i } as FlatRow));
    } else {
      this.flatRows = rows.map((r, i) => ({ _type: 'data', _data: r, _rowIndex: i } as FlatRow));
    }

    this.cdr.markForCheck();
  }

  private flattenGroups(rows: any[], groupKeys: string[], level: number, parentPath: string): FlatRow[] {
    const key = groupKeys[0];
    const remaining = groupKeys.slice(1);
    const groups = new Map<any, any[]>();
    for (const row of rows) {
      const val = row[key];
      if (!groups.has(val)) groups.set(val, []);
      groups.get(val)!.push(row);
    }
    const col = this._cols.find(c => c.key === key);
    const result: FlatRow[] = [];
    for (const [val, groupRows] of groups) {
      const path = parentPath ? `${parentPath}||${key}=${val}` : `${key}=${val}`;
      const expanded = !this.collapsedPaths.has(path);
      result.push({
        _type: 'group', _key: key, _value: val,
        _label: this.getCellDisplayByKey(val, col!, undefined),
        _colLabel: col?.label ?? key,
        _level: level, _count: groupRows.length,
        _expanded: expanded, _path: path,
      });
      if (expanded) {
        if (remaining.length > 0) {
          result.push(...this.flattenGroups(groupRows, remaining, level + 1, path));
        } else {
          groupRows.forEach((r, i) => result.push({ _type: 'data', _data: r, _rowIndex: i }));
        }
      }
    }
    return result;
  }

  // ─── Sort ─────────────────────────────────────────────────────────────────────

  onHeaderClick(col: InternalColumn, event: MouseEvent): void {
    if (!col.sortable) return;
    if (this._suppressNextHeaderClick || this._columnDragJustEnded) return;
    const existing = this.sortStates.get(col.key);
    if (event.shiftKey) {
      if (existing) {
        existing.asc ? this.sortStates.set(col.key, { ...existing, asc: false })
          : this.sortStates.delete(col.key);
      } else {
        this.sortStates.set(col.key, { key: col.key, asc: true, index: this.sortCounter++ });
      }
    } else {
      this.sortStates.clear();
      this.sortStates.set(col.key, { key: col.key, asc: existing ? !existing.asc : true, index: 0 });
      this.sortCounter = 1;
    }
    this.sortChange.emit({ sorts: [...this.sortStates.values()].map(s => ({ key: s.key, asc: s.asc })) });
    this.processData();
  }

  getSortState(key: string): SortState | undefined { return this.sortStates.get(key); }

  clearSort(): void { this.sortStates.clear(); this.processData(); }

  // ─── Column search ────────────────────────────────────────────────────────────

  onColumnSearch(key: string, value: string): void {
    this.columnSearch[key] = value;
    this.currentPage = 1;
    this.processData();
  }

  // ─── Excel filter ─────────────────────────────────────────────────────────────

  openExcelFilter(key: string, event: Event): void {
    event.stopPropagation();
    if (this.openFilterKey === key) { this.openFilterKey = null; return; }
    this.buildExcelFilterItems(key);
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    this.filterDropdownPos = {
      top: rect.bottom + 4,
      left: Math.max(4, Math.min(rect.left, window.innerWidth - 264)),
    };
    this.openFilterKey = key;
  }

  private getFilteredRowsExcluding(excludeKey: string): any[] {
    let rows = [...this.datasource];

    if (this.globalSearch.trim()) {
      const term = this.globalSearch.toLowerCase();
      rows = rows.filter(row =>
        this.visibleCols.some(col => String(this.getCellDisplay(row, col)).toLowerCase().includes(term))
      );
    }

    for (const col of this._cols) {
      const term = (this.columnSearch[col.key] ?? '').trim().toLowerCase();
      if (term) {
        rows = rows.filter(row => String(this.getCellDisplay(row, col)).toLowerCase().includes(term));
      }
    }

    for (const [key, activeSet] of Object.entries(this.excelFilters)) {
      if (key === excludeKey) continue;
      if (activeSet.size > 0) {
        rows = rows.filter(row => activeSet.has(row[key]));
      }
    }

    return rows;
  }

  private buildExcelFilterItems(key: string): void {
    const activeSet = this.excelFilters[key] ?? new Set();
    const col = this._cols.find(c => c.key === key)!;
    const seen = new Map<any, string>();
    for (const row of this.getFilteredRowsExcluding(key)) {
      const val = row[key];
      if (!seen.has(val)) seen.set(val, this.getCellDisplayByKey(val, col, undefined));
    }
    this.excelFilterState[key] = {
      search: this.excelFilterState[key]?.search ?? '',
      allItems: [...seen.entries()].map(([value, label]) => ({
        value, label,
        checked: activeSet.size === 0 || activeSet.has(value),
      })),
    };
  }

  getFilteredExcelItems(key: string): ExcelFilterState['allItems'] {
    const state = this.excelFilterState[key];
    if (!state) return [];
    const s = state.search.toLowerCase();
    return s ? state.allItems.filter(i => i.label.toLowerCase().includes(s)) : state.allItems;
  }

  isAllExcelChecked(key: string): boolean {
    const state = this.excelFilterState[key];
    return !!state && state.allItems.every(i => i.checked);
  }

  toggleAllExcelFilter(key: string, checked: boolean): void {
    this.excelFilterState[key]?.allItems.forEach(i => (i.checked = checked));
  }

  applyExcelFilter(key: string): void {
    const state = this.excelFilterState[key];
    if (!state) return;
    const checked = state.allItems.filter(i => i.checked).map(i => i.value);
    if (checked.length === state.allItems.length) {
      delete this.excelFilters[key];
    } else {
      this.excelFilters[key] = new Set(checked);
    }
    this.openFilterKey = null;
    this.currentPage = 1;
    this.processData();
  }

  clearExcelFilter(key: string, event?: Event): void {
    event?.stopPropagation();
    delete this.excelFilters[key];
    if (this.excelFilterState[key]) this.excelFilterState[key].allItems.forEach(i => (i.checked = true));
    this.processData();
  }

  hasActiveFilter(key: string): boolean {
    return !!this.excelFilters[key] && this.excelFilters[key].size > 0;
  }

  clearAllFilters(): void {
    this.excelFilters = {};
    this.excelFilterState = {};
    this.columnSearch = {};
    this.globalSearch = '';
    this.currentPage = 1;
    this.processData();
  }

  get hasAnyFilter(): boolean {
    return !!this.globalSearch.trim()
      || Object.values(this.columnSearch).some(v => !!v?.trim())
      || Object.values(this.excelFilters).some(s => s.size > 0);
  }

  // ─── Grouping ─────────────────────────────────────────────────────────────────

  addGroup(key: string): void {
    if (!this.activeGroups.includes(key)) {
      this.activeGroups.push(key);
      this.collapsedPaths.clear();
      this.processData();
    }
  }

  removeGroup(key: string): void {
    this.activeGroups = this.activeGroups.filter(k => k !== key);
    this.collapsedPaths.clear();
    this.processData();
  }

  clearGroups(): void { this.activeGroups = []; this.collapsedPaths.clear(); this.processData(); }

  toggleGroup(path: string): void {
    this.collapsedPaths.has(path) ? this.collapsedPaths.delete(path) : this.collapsedPaths.add(path);
    this.processData();
  }

  expandAll(): void { this.collapsedPaths.clear(); this.processData(); }

  collapseAll(): void {
    this.flatRows
      .filter((r): r is Extract<FlatRow, { _type: 'group' }> => r._type === 'group' && r._level === 0)
      .forEach(r => this.collapsedPaths.add(r._path));
    this.processData();
  }

  onGroupPanelDrop(event: CdkDragDrop<string[]>): void {
    moveItemInArray(this.activeGroups, event.previousIndex, event.currentIndex);
    this.collapsedPaths.clear();
    this.processData();
  }

  getGroupColLabel(key: string): string {
    return this._cols.find(c => c.key === key)?.label ?? key;
  }

  // ─── Column config ────────────────────────────────────────────────────────────

  toggleColumnVisibility(col: InternalColumn): void {
    col._hidden = !col._hidden;
    this.recomputePinnedOffsets();
    this.updateVisibleCols();
    this.processData();
  }

  toggleColumnPin(col: InternalColumn): void {
    col._pinned = !col._pinned;
    const pinned = this._cols.filter(c => c._pinned);
    const unpinned = this._cols.filter(c => !c._pinned);
    this._cols = [...pinned, ...unpinned];
    this.recomputePinnedOffsets();
    this.updateVisibleCols();
    this.closeColumnMenu();
    this.cdr.markForCheck();
  }

  // Header drag: CDK indices are relative to visibleCols DOM order
  onColumnReorder(event: CdkDragDrop<InternalColumn[]>): void {
    if (event.previousIndex === event.currentIndex) return;
    const fromCol = this._visibleCols[event.previousIndex];
    const toCol   = this._visibleCols[event.currentIndex];
    if (!fromCol || !toCol) return;
    const fromIdx = this._cols.indexOf(fromCol);
    const toIdx   = this._cols.indexOf(toCol);
    if (fromIdx === -1 || toIdx === -1) return;
    moveItemInArray(this._cols, fromIdx, toIdx);
    this.recomputePinnedOffsets();
    this.updateVisibleCols();
    this.cdr.markForCheck();
  }

  // Config panel drag: CDK indices are relative to _cols directly
  onConfigColumnReorder(event: CdkDragDrop<InternalColumn[]>): void {
    if (event.previousIndex === event.currentIndex) return;
    moveItemInArray(this._cols, event.previousIndex, event.currentIndex);
    this.recomputePinnedOffsets();
    this.updateVisibleCols();
    this.cdr.markForCheck();
  }

  autoSizeColumn(col: InternalColumn, event?: Event): void {
    event?.stopPropagation();
    const labelPx = col.label.length * 8 + 48;
    const sample = this.datasource.slice(0, 200);
    const maxDataPx = sample.reduce((max, row) => {
      const len = String(this.getCellDisplay(row, col)).length * 7 + 24;
      return Math.max(max, len);
    }, 0);
    col._width = Math.max(col.minWidth ?? 60, Math.min(Math.max(labelPx, maxDataPx), 420));
    this.recomputePinnedOffsets();
    this.updateVisibleCols();
    this.closeColumnMenu();
    this.cdr.markForCheck();
  }

  autoSizeAll(): void { this.visibleCols.forEach(c => this.autoSizeColumn(c)); }

  // ─── Column menu ──────────────────────────────────────────────────────────────

  openColumnMenu(key: string, event: Event): void {
    event.stopPropagation();
    this.columnMenuKey = this.columnMenuKey === key ? null : key;
    if (this.columnMenuKey) {
      const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
      this.columnMenuPos = { top: rect.bottom + 4, left: Math.max(rect.left - 100, 4) };
    }
  }

  closeColumnMenu(): void { this.columnMenuKey = null; }

  getColumnByKey(key: string): InternalColumn | undefined {
    return this._cols.find(c => c.key === key);
  }

  // ─── Column resize ────────────────────────────────────────────────────────────

  startResize(col: InternalColumn, event: MouseEvent): void {
    event.stopPropagation();
    event.preventDefault();
    this.resizing = { key: col.key, startX: event.clientX, startWidth: col._width };
  }

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent): void {
    if (!this.resizing) return;
    const col = this._cols.find(c => c.key === this.resizing!.key);
    if (!col) return;
    col._width = Math.max(col.minWidth ?? 60, this.resizing.startWidth + (event.clientX - this.resizing.startX));
    this.recomputePinnedOffsets();
    this._totalWidth = this._visibleCols.reduce((s, c) => s + c._width, 0)
      + (this.rowSelection === 'multiple' ? 36 : 0);
    this.cdr.markForCheck();
  }

  @HostListener('document:mouseup')
  onMouseUp(): void {
    if (this.resizing) {
      this._suppressNextHeaderClick = true;
      setTimeout(() => { this._suppressNextHeaderClick = false; }, 100);
    }
    this.resizing = null;
    this.cdr.markForCheck();
  }

  onColumnDragStarted(): void { this._columnDragJustEnded = false; }

  onColumnDragEnded(): void {
    this._columnDragJustEnded = true;
    setTimeout(() => { this._columnDragJustEnded = false; }, 100);
  }

  showAllColumns(): void {
    this._cols.forEach(c => (c._hidden = false));
    this.recomputePinnedOffsets();
    this.updateVisibleCols();
    this.cdr.markForCheck();
  }

  // ─── Header scroll sync ───────────────────────────────────────────────────────

  onBodyScroll(event: Event): void {
    const scrollLeft = (event.target as HTMLElement).scrollLeft;
    if (this.headerScrollRef) {
      this.headerScrollRef.nativeElement.scrollLeft = scrollLeft;
    }
  }

  // ─── Row selection ────────────────────────────────────────────────────────────

  onRowClick(row: any, event: MouseEvent): void {
    this.rowClick.emit(row);
    if (!this.rowSelection) return;
    if (this.rowSelection === 'single') {
      this.selectedRows.clear();
      this.selectedRows.add(row);
    } else {
      if (this.selectedRows.has(row)) {
        this.selectedRows.delete(row);
      } else {
        if (!event.ctrlKey) this.selectedRows.clear();
        this.selectedRows.add(row);
      }
    }
    this.selectionChange.emit([...this.selectedRows]);
  }

  toggleRowSelect(row: any, event: Event): void {
    event.stopPropagation();
    this.selectedRows.has(row) ? this.selectedRows.delete(row) : this.selectedRows.add(row);
    this.selectionChange.emit([...this.selectedRows]);
  }

  toggleSelectAll(checked: boolean): void {
    this.selectedRows.clear();
    if (checked) {
      this.flatRows.filter(r => r._type === 'data').forEach((r: any) => this.selectedRows.add(r._data));
    }
    this.selectionChange.emit([...this.selectedRows]);
  }

  get allSelected(): boolean {
    const dr = this.flatRows.filter(r => r._type === 'data');
    return dr.length > 0 && dr.every((r: any) => this.selectedRows.has(r._data));
  }

  get someSelected(): boolean {
    return this.selectedRows.size > 0 && !this.allSelected;
  }

  // ─── Pagination ───────────────────────────────────────────────────────────────

  get _total(): number { return this.autoMode ? this._filteredTotal : this.totalRecords; }
  get totalPages(): number { return Math.ceil(this._total / this.pageSize) || 1; }

  get pageNumbers(): number[] {
    const total = this.totalPages;
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const pages: number[] = [1];
    if (this.currentPage > 3) pages.push(-1);
    for (let i = Math.max(2, this.currentPage - 1); i <= Math.min(total - 1, this.currentPage + 1); i++) pages.push(i);
    if (this.currentPage < total - 2) pages.push(-1);
    pages.push(total);
    return pages;
  }

  get startRecord(): number { return this._total === 0 ? 0 : (this.currentPage - 1) * this.pageSize + 1; }
  get endRecord(): number { return Math.min(this.currentPage * this.pageSize, this._total); }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.processData();
    this.pageChange.emit({ page: this.currentPage, pageSize: this.pageSize });
  }

  onPageSizeChange(size: number): void {
    this.pageSize = Number(size);
    this.currentPage = 1;
    this.processData();
    this.pageSizeChange.emit({ page: 1, pageSize: this.pageSize });
  }

  // ─── Export Excel ─────────────────────────────────────────────────────────────

  exportExcel(): void {
    this._doExportExcel().catch(err => console.error('Excel export failed:', err));
  }

  private async _doExportExcel(): Promise<void> {
    const xlsxMod = await import('xlsx-js-style');
    // Handle both ESM default-export and CJS direct-export shapes
    const XLSX: any = (xlsxMod as any).default ?? xlsxMod;

    const cols = this.visibleCols;
    const filteredRows = this.getSortedFilteredRows();

    const thinBorder = (rgb = 'D9D9D9') => ({
      top: { style: 'thin', color: { rgb } },
      bottom: { style: 'thin', color: { rgb } },
      left: { style: 'thin', color: { rgb } },
      right: { style: 'thin', color: { rgb } },
    });

    const headerStyle = {
      font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 10 },
      fill: { patternType: 'solid', fgColor: { rgb: '4472C4' } },
      alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
      border: thinBorder('4472C4'),
    };

    // Per-level group header colors (background / font)
    const groupColors = [
      { bg: 'D9E1F2', fg: '1F3864' },
      { bg: 'E2EFDA', fg: '375623' },
      { bg: 'FFF2CC', fg: '7F6000' },
    ];

    const dataStyle = {
      font: { sz: 10 },
      border: thinBorder(),
    };

    const ws: any = {};
    const merges: { s: { r: number; c: number }; e: { r: number; c: number } }[] = [];
    let rowIdx = 0;

    // ── Header group row ────────────────────────────────────────────────────────
    if (this.hasHeaderGroups) {
      let colIdx = 0;
      let i = 0;
      while (i < cols.length) {
        const groupLabel = cols[i].headerGroup ?? '';
        let span = 1;
        while (i + span < cols.length && (cols[i + span].headerGroup ?? '') === groupLabel) span++;
        ws[XLSX.utils.encode_cell({ r: rowIdx, c: colIdx })] = { v: groupLabel, t: 's', s: headerStyle };
        for (let k = 1; k < span; k++) {
          ws[XLSX.utils.encode_cell({ r: rowIdx, c: colIdx + k })] = { v: '', t: 's', s: headerStyle };
        }
        if (span > 1) merges.push({ s: { r: rowIdx, c: colIdx }, e: { r: rowIdx, c: colIdx + span - 1 } });
        colIdx += span;
        i += span;
      }
      rowIdx++;
    }

    // ── Column label row ────────────────────────────────────────────────────────
    cols.forEach((col, ci) => {
      ws[XLSX.utils.encode_cell({ r: rowIdx, c: ci })] = { v: col.label, t: 's', s: headerStyle };
    });
    rowIdx++;

    // ── Data / group rows ───────────────────────────────────────────────────────
    const writeDataRows = (rows: any[]): void => {
      rows.forEach(r => {
        cols.forEach((col, ci) => {
          ws[XLSX.utils.encode_cell({ r: rowIdx, c: ci })] = {
            v: this.getCellDisplay(r, col), t: 's', s: dataStyle,
          };
        });
        rowIdx++;
      });
    };

    const buildExcelRows = (rows: any[], groupKeys: string[], level: number): void => {
      if (groupKeys.length === 0) { writeDataRows(rows); return; }
      const key = groupKeys[0];
      const remaining = groupKeys.slice(1);
      const groups = new Map<any, any[]>();
      for (const row of rows) {
        const v = row[key]; if (!groups.has(v)) groups.set(v, []); groups.get(v)!.push(row);
      }
      const colDef = this._cols.find(c => c.key === key)!;
      const color = groupColors[Math.min(level, groupColors.length - 1)];
      const groupStyle = {
        font: { bold: true, color: { rgb: color.fg }, sz: 10 },
        fill: { patternType: 'solid', fgColor: { rgb: color.bg } },
        alignment: { horizontal: 'left', vertical: 'center' },
        border: thinBorder(),
      };
      const subtotalStyle = {
        font: { bold: true, sz: 10 },
        fill: { patternType: 'solid', fgColor: { rgb: 'F2F2F2' } },
        border: thinBorder(),
      };
      const sumCols = cols.filter(c => c.sumOnPdf);

      for (const [val, gr] of groups) {
        const label = this.getCellDisplayByKey(val, colDef, undefined);
        const indent = '  '.repeat(level);
        ws[XLSX.utils.encode_cell({ r: rowIdx, c: 0 })] = {
          v: `${indent}${colDef?.label ?? key}: ${label}  (${gr.length} rows)`, t: 's', s: groupStyle,
        };
        for (let k = 1; k < cols.length; k++) {
          ws[XLSX.utils.encode_cell({ r: rowIdx, c: k })] = { v: '', t: 's', s: groupStyle };
        }
        if (cols.length > 1) merges.push({ s: { r: rowIdx, c: 0 }, e: { r: rowIdx, c: cols.length - 1 } });
        rowIdx++;

        buildExcelRows(gr, remaining, level + 1);

        if (sumCols.length > 0) {
          cols.forEach((col, ci) => {
            if (col.sumOnPdf) {
              const s = gr.map(r => Number(r[col.key])).filter(v => !isNaN(v)).reduce((a, b) => a + b, 0);
              ws[XLSX.utils.encode_cell({ r: rowIdx, c: ci })] = {
                v: s, t: 'n', s: { ...subtotalStyle, alignment: { horizontal: 'right' } },
              };
            } else {
              ws[XLSX.utils.encode_cell({ r: rowIdx, c: ci })] = {
                v: ci === 0 ? `${indent}Subtotal: ${label}` : '', t: 's', s: subtotalStyle,
              };
            }
          });
          rowIdx++;
        }
      }
    };

    if (this.activeGroups.length > 0) {
      buildExcelRows(filteredRows, this.activeGroups, 0);
    } else {
      writeDataRows(filteredRows);
    }

    // ── Grand total row ─────────────────────────────────────────────────────────
    const sumCols = cols.filter(c => c.sumOnPdf);
    if (sumCols.length > 0) {
      const grandStyle = {
        font: { bold: true, sz: 10 },
        fill: { patternType: 'solid', fgColor: { rgb: 'D9D9D9' } },
        border: thinBorder('000000'),
      };
      cols.forEach((col, ci) => {
        if (col.sumOnPdf) {
          const s = filteredRows.map(r => Number(r[col.key])).filter(v => !isNaN(v)).reduce((a, b) => a + b, 0);
          ws[XLSX.utils.encode_cell({ r: rowIdx, c: ci })] = {
            v: s, t: 'n', s: { ...grandStyle, alignment: { horizontal: 'right' } },
          };
        } else {
          ws[XLSX.utils.encode_cell({ r: rowIdx, c: ci })] = {
            v: ci === 0 ? 'Grand Total' : '', t: 's', s: grandStyle,
          };
        }
      });
      rowIdx++;
    }

    ws['!ref'] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: rowIdx - 1, c: cols.length - 1 } });
    ws['!cols'] = cols.map(c => ({ wpx: c._width }));
    if (merges.length) ws['!merges'] = merges;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, (this.title || 'Report').slice(0, 31));
    XLSX.writeFile(wb, `${this.title || 'report'}.xlsx`);
  }

  // ─── Export PDF ───────────────────────────────────────────────────────────────

  async exportPdf(): Promise<void> {
    const [{ jsPDF }, { default: autoTable }] = await Promise.all([
      import('jspdf'),
      import('jspdf-autotable'),
    ]);

    const cfg = this.pdfConfig ?? {};
    const orientation = cfg.orientation ?? 'landscape';
    const doc = new jsPDF({ orientation, unit: 'pt', format: 'a4' });
    const pw = doc.internal.pageSize.getWidth();
    const ph = doc.internal.pageSize.getHeight();
    const margin = 36;
    const usableW = pw - margin * 2;
    let yPos = margin;

    // Logo (top-left) + Company name/address (center)
    const logoH = 50;
    if (cfg.logo) {
      try {
        const img = await this._loadImageForPdf(cfg.logo);
        const logoW = (img.naturalWidth / img.naturalHeight) * logoH;
        doc.addImage(img.dataUrl, img.imgType as any, margin, yPos, logoW, logoH);
      } catch { /* ignore broken logo */ }
    }
    if (cfg.companyName) {
      doc.setFont('helvetica', 'bold'); doc.setFontSize(16); doc.setTextColor(0, 0, 0);
      doc.text(cfg.companyName, pw / 2, yPos + 20, { align: 'center' });
    }
    if (cfg.companyAddress) {
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(60, 60, 60);
      doc.text(cfg.companyAddress, pw / 2, yPos + 34, { align: 'center' });
    }
    if (cfg.logo || cfg.companyName || cfg.companyAddress) { yPos += logoH + 10; }

    // Report name: ══════ Report Name ══════ (double lines on each side, centered)
    if (cfg.reportName) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      const textW = doc.getTextWidth(cfg.reportName);
      const cx  = pw / 2;
      const gap = 12;
      const ty  = yPos + 16;  // text baseline
      const ly  = ty - 5;     // top line Y
      doc.setLineWidth(0.4);
      doc.setDrawColor(0, 0, 0);
      // left double lines — end exactly where the text begins
      doc.line(margin, ly,     cx - textW / 2 - gap, ly);
      doc.line(margin, ly + 2, cx - textW / 2 - gap, ly + 2);
      // centered report name
      doc.text(cfg.reportName, cx, ty, { align: 'center' });
      // right double lines — start exactly where the text ends
      doc.line(cx + textW / 2 + gap, ly,     pw - margin, ly);
      doc.line(cx + textW / 2 + gap, ly + 2, pw - margin, ly + 2);
      yPos = ty + 14;
    }

    // Build table body (recursive, supports groups + subtotals)
    const cols = this.visibleCols;
    const filteredRows = this.getSortedFilteredRows();
    const totalGridW = cols.reduce((s, c) => s + c._width, 0) || 1;
    const colWidths = cols.map(c => (c._width / totalGridW) * usableW);
    const sumCols = cols.filter(c => c.sumOnPdf);

    const body: any[][] = [];
    // Light gray shading per group level — no blue, clean financial-report look
    const groupBg    = [[242, 242, 242], [247, 247, 247], [252, 252, 252]];
    const subtotalBg = [[232, 232, 232], [237, 237, 237], [242, 242, 242]];

    const buildPdfRows = (rows: any[], groupKeys: string[], level: number): void => {
      if (groupKeys.length === 0) {
        rows.forEach(r => body.push(cols.map(col => ({
          content: this.getCellDisplay(r, col),
          styles: { halign: col.align ?? 'left', textColor: [0, 0, 0] },
        }))));
        return;
      }
      const key = groupKeys[0];
      const remaining = groupKeys.slice(1);
      const groups = new Map<any, any[]>();
      for (const row of rows) { const v = row[key]; if (!groups.has(v)) groups.set(v, []); groups.get(v)!.push(row); }
      const colDef = this._cols.find(c => c.key === key)!;
      const bg = groupBg[Math.min(level, groupBg.length - 1)];
      const sb = subtotalBg[Math.min(level, subtotalBg.length - 1)];

      for (const [val, gr] of groups) {
        const label = this.getCellDisplayByKey(val, colDef, undefined);
        const indent = '    '.repeat(level);
        body.push([{
          content: `${indent}${colDef?.label ?? key}: ${label}   (${gr.length.toLocaleString()} rows)`,
          colSpan: cols.length,
          styles: { fontStyle: 'bold', fillColor: bg, textColor: [0, 0, 0] },
        }]);
        buildPdfRows(gr, remaining, level + 1);
        if (sumCols.length > 0) {
          body.push(cols.map((col, i) => {
            if (col.sumOnPdf) {
              const s = gr.map(r => Number(r[col.key])).filter(v => !isNaN(v)).reduce((a, b) => a + b, 0);
              return { content: this.decimalPipe.transform(s, '1.0-2') ?? String(s), styles: { fontStyle: 'bold', halign: 'right', fillColor: sb, textColor: [0, 0, 0] } };
            }
            return { content: i === 0 ? `${indent}Subtotal: ${label}` : '', styles: { fontStyle: 'bold', fillColor: sb, textColor: [0, 0, 0] } };
          }));
        }
      }
    };

    if (this.activeGroups.length > 0) {
      buildPdfRows(filteredRows, this.activeGroups, 0);
    } else {
      filteredRows.forEach(r => body.push(cols.map(col => ({
        content: this.getCellDisplay(r, col),
        styles: { halign: col.align ?? 'left', textColor: [0, 0, 0] },
      }))));
    }

    // Grand total row
    if (sumCols.length > 0) {
      body.push(cols.map((col, i) => {
        if (col.sumOnPdf) {
          const s = filteredRows.map(r => Number(r[col.key])).filter(v => !isNaN(v)).reduce((a, b) => a + b, 0);
          return { content: this.decimalPipe.transform(s, '1.0-2') ?? String(s), styles: { fontStyle: 'bold', halign: 'right', fillColor: [220, 220, 220], textColor: [0, 0, 0] } };
        }
        return { content: i === 0 ? 'Grand Total' : '', styles: { fontStyle: 'bold', fillColor: [220, 220, 220], textColor: [0, 0, 0] } };
      }));
    }

    // Render table: clean black-bordered financial-report style
    const colStylesMap: Record<number, any> = {};
    cols.forEach((_col, i) => { colStylesMap[i] = { cellWidth: colWidths[i] }; });

    // Build double header rows when headerGroup is used
    const colLabelsRow = cols.map((c, i) => ({ content: c.label, styles: { halign: c.align ?? 'left', cellWidth: colWidths[i] } }));
    const pdfHead: any[][] = [];
    if (this.hasHeaderGroups) {
      const groupRow: any[] = [];
      let i = 0;
      while (i < cols.length) {
        const groupLabel = cols[i].headerGroup ?? '';
        let span = 1;
        while (i + span < cols.length && (cols[i + span].headerGroup ?? '') === groupLabel) span++;
        groupRow.push({ content: groupLabel, colSpan: span, styles: { halign: 'center', fontStyle: 'bold' } });
        i += span;
      }
      pdfHead.push(groupRow);
    }
    pdfHead.push(colLabelsRow);

    autoTable(doc, {
      head: pdfHead,
      body,
      startY: yPos,
      margin: { left: margin, right: margin, top: margin, bottom: margin + 18 },
      styles: {
        fontSize: 8,
        cellPadding: { top: 4, right: 6, bottom: 4, left: 6 },
        overflow: 'linebreak',
        lineColor: [0, 0, 0],
        lineWidth: 0.3,
        textColor: [0, 0, 0],
        fillColor: [255, 255, 255],
      },
      headStyles: {
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        fontSize: 8.5,
        lineColor: [0, 0, 0],
        lineWidth: 0.4,
      },
      alternateRowStyles: cfg.alternatingRows ? { fillColor: [248, 248, 248] } : {},
      columnStyles: colStylesMap,
      showHead: 'everyPage',
      tableLineColor: [0, 0, 0],
      tableLineWidth: 0.4,
    } as any);

    // Footer: page numbers + timestamp on every page
    const total = (doc as any).internal.pages.length - 1;
    const ts = new Date().toLocaleString();
    for (let p = 1; p <= total; p++) {
      doc.setPage(p);
      doc.setFontSize(7.5); doc.setTextColor(100);
      doc.text(`Generated: ${ts}`, margin, ph - 14);
      doc.text(`Page ${p} of ${total}`, pw - margin, ph - 14, { align: 'right' });
      doc.setTextColor(0);
    }

    doc.save(`${this.title || 'report'}.pdf`);
  }

  private async _loadImageForPdf(src: string): Promise<{ dataUrl: string; imgType: string; naturalWidth: number; naturalHeight: number }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth; canvas.height = img.naturalHeight;
        canvas.getContext('2d')!.drawImage(img, 0, 0);
        const ext = (src.split('?')[0].split('.').pop() ?? '').toLowerCase();
        const imgType = ext === 'png' ? 'PNG' : 'JPEG';
        resolve({ dataUrl: canvas.toDataURL(`image/${imgType.toLowerCase()}`), imgType, naturalWidth: img.naturalWidth, naturalHeight: img.naturalHeight });
      };
      img.onerror = reject;
      img.src = src;
    });
  }

  // ─── Aggregates ───────────────────────────────────────────────────────────────

  getAggregate(col: InternalColumn): string {
    if (!col.aggregate) return '';
    const vals = this.flatRows
      .filter(r => r._type === 'data')
      .map((r: any) => Number(r._data[col.key]))
      .filter(v => !isNaN(v));
    if (!vals.length) return '--';
    const fmt = (n: number) => this.decimalPipe.transform(n, '1.0-2') ?? String(n);
    switch (col.aggregate) {
      case 'sum':   return fmt(vals.reduce((a, b) => a + b, 0));
      case 'avg':   return fmt(vals.reduce((a, b) => a + b, 0) / vals.length);
      case 'count': return String(vals.length);
      case 'min':   return fmt(Math.min(...vals));
      case 'max':   return fmt(Math.max(...vals));
      default:      return '';
    }
  }

  hasAnyAggregate(): boolean { return this.visibleCols.some(c => !!c.aggregate); }

  // ─── Cell display ─────────────────────────────────────────────────────────────

  getCellDisplay(row: any, col: InternalColumn): string {
    return this.getCellDisplayByKey(row[col.key], col, row);
  }

  getCellDisplayByKey(raw: any, col: InternalColumn, row: any): string {
    if (col.displayFn && row !== undefined) return col.displayFn(raw, row);
    if (col.enums?.length) return col.enums.find(e => e.value === raw)?.label ?? (raw ?? '--');
    if (raw === null || raw === undefined || raw === '') return '--';
    switch (col.displayType) {
      case 'date':       return this.datePipe.transform(raw, 'MM/dd/yyyy') ?? '--';
      case 'datetime':   return this.datePipe.transform(raw, 'MM/dd/yyyy HH:mm') ?? '--';
      case 'time':       return this.datePipe.transform(raw, 'HH:mm') ?? '--';
      case 'currency':   return '$' + Number(raw).toLocaleString('en-US', { minimumFractionDigits: 2 });
      case 'number':     return Number(raw).toLocaleString();
      case 'percentage': return Number(raw).toFixed(2) + '%';
      default:           return String(raw);
    }
  }

  getCellClass(row: any, col: InternalColumn): string {
    if (!col.cellClass) return '';
    return typeof col.cellClass === 'function' ? col.cellClass(row[col.key], row) : col.cellClass;
  }

  // ─── Copy cell ────────────────────────────────────────────────────────────────

  copyCell(value: string, event: Event): void {
    event.stopPropagation();
    navigator.clipboard?.writeText(value).then(() => {
      this.copiedCell = value;
      setTimeout(() => (this.copiedCell = null), 1500);
    });
  }

  // ─── Skeleton / empty ─────────────────────────────────────────────────────────

  get skeletonRows(): number[] { return Array.from({ length: Math.min(this.pageSize, 15) }); }

  get isEmpty(): boolean {
    return !this.loading && this.flatRows.length === 0;
  }

  // ─── Global click close ───────────────────────────────────────────────────────

  @HostListener('document:click')
  onDocumentClick(): void {
    this.openFilterKey = null;
    this.columnMenuKey = null;
  }

  // ─── TrackBy ─────────────────────────────────────────────────────────────────

  trackByRow = (_: number, row: FlatRow): any =>
    row._type === 'data' ? `d-${row._rowIndex}` : `g-${(row as any)._path}`;

  trackByCol = (_: number, col: InternalColumn): string => col.key;

  trackByStr = (_: number, s: string): string => s;

  asGroupRow = (row: FlatRow): Extract<FlatRow, { _type: 'group' }> =>
    row as Extract<FlatRow, { _type: 'group' }>;

  asDataRow = (row: FlatRow): Extract<FlatRow, { _type: 'data' }> =>
    row as Extract<FlatRow, { _type: 'data' }>;
}
