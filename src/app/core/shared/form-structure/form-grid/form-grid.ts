import { Component, EventEmitter, Input, Output } from '@angular/core';
import { elements } from '../dynamic-form/dynamic-form';
import {
  CdkDragDrop,
  CdkDragEnd,
  CdkDragEnter,
  CdkDragExit,
  CdkDragStart,
  moveItemInArray,
} from '@angular/cdk/drag-drop';

// ── Existing interfaces ────────────────────────────────────────────────────────

export interface OslFormGridColumn {
  key: string;
  displayName: string;
  label?: string;
  /** When provided, renders the matching dynamic-form element in the cell bound to row[key]. */
  formElem?: elements;
  /** Optional CSS width, e.g. '150px' or '20%'. */
  width?: string;
}

export interface OslFormGridFooterColumn {
  colspan?: number;
  display?: string;
  displayFn?: (datasource: any[]) => any;
  class?: string;
}

export interface OslFormGridRowEvent {
  row: any;
  index: number;
}

// ── Drag & Drop interfaces ─────────────────────────────────────────────────────

export interface DragItem {
  id: string;
  label: string;
  icon?: string;
  description?: string;
  data?: any;
}

export interface DragColumn {
  field: string;
  header: string;
}

export interface DragDropPayload {
  item: DragItem | any;
  previousIndex: number;
  currentIndex: number;
  previousContainer: string;
  currentContainer: string;
  row?: any;
  column?: any;
}

export interface PanelSearchEvent {
  searchValue: string;
  page: number;
  pageSize: number;
}

export interface PanelPageEvent {
  page: number;
  pageSize: number;
  searchValue: string;
}

// ─────────────────────────────────────────────────────────────────────────────

@Component({
  selector: 'osl-form-grid',
  standalone: false,
  templateUrl: './form-grid.html',
  styleUrl: './form-grid.scss',
})
export class OslFormGrid {
  // ── Existing inputs ────────────────────────────────────────────────────────
  @Input('columns') columns: OslFormGridColumn[] = [];
  @Input('datasource') datasource: any[] = [];
  @Output() datasourceChange = new EventEmitter<any[]>();

  @Input('isPaginated') isPaginated: boolean = false;
  @Input('pageSize') pageSize: number = 10;
  @Input('canAdd') canAdd: boolean = true;
  @Input('canDelete') canDelete: boolean = true;
  @Input('loading') loading: boolean = false;
  @Input('tableHeight') tableHeight: string = '350px';
  @Input('footerColumns') footerColumns: OslFormGridFooterColumn[] = [];

  @Output() rowAdd = new EventEmitter<any>();
  @Output() rowDelete = new EventEmitter<OslFormGridRowEvent>();

  // ── Drag & Drop inputs ─────────────────────────────────────────────────────
  @Input() enableDragDrop = false;
  @Input() draggingList: DragItem[] = [];
  @Input() draggingColumns: DragColumn[] = [];
  @Input() leftPanelWidth = 320;
  @Input() dragTitle = 'Available Controls';
  @Input() showSearch = true;
  @Input() allowReorder = true;
  @Input() allowRemove = true;

  /** 'Local' filters draggingList in the component. 'Api' emits (panelSearch) for the parent to handle. */
  @Input() panelSearchType: 'Local' | 'Api' = 'Local';
  /** Show a loading skeleton in the panel (useful in Api mode while the parent fetches data). */
  @Input() panelLoading = false;
  /** Total records available from the API (used to decide whether to show "Load More"). */
  @Input() panelTotalRecords = 0;
  /** Number of items per page when calling the API. */
  @Input() panelPageSize = 20;

  // ── Drag & Drop outputs ────────────────────────────────────────────────────
  @Output() dragStarted = new EventEmitter<DragDropPayload>();
  @Output() dragEnded = new EventEmitter<DragDropPayload>();
  @Output() dragEntered = new EventEmitter<DragDropPayload>();
  @Output() dragExited = new EventEmitter<DragDropPayload>();
  @Output() itemDropped = new EventEmitter<DragDropPayload>();
  @Output() itemMoved = new EventEmitter<DragDropPayload>();
  @Output() itemRemoved = new EventEmitter<DragDropPayload>();
  @Output() itemSelected = new EventEmitter<DragDropPayload>();
  @Output() gridChanged = new EventEmitter<any[]>();

  /** Emitted (debounced 350 ms) when the user types in the panel search box and panelSearchType='Api'. */
  @Output() panelSearch = new EventEmitter<PanelSearchEvent>();
  /** Emitted when the user clicks "Load More" in the panel. Parent should append items to draggingList. */
  @Output() panelPageChange = new EventEmitter<PanelPageEvent>();

  // ── Drag & Drop state ──────────────────────────────────────────────────────
  isDragging = false;
  isDraggingFromPanel = false;
  dragSearchQuery = '';
  panelCurrentPage = 1;
  private _panelSearchDebounce: ReturnType<typeof setTimeout> | null = null;

  get filteredDraggingList(): DragItem[] {
    if (this.panelSearchType === 'Api') return this.draggingList;
    if (!this.dragSearchQuery.trim()) return this.draggingList;
    const q = this.dragSearchQuery.toLowerCase();
    return this.draggingList.filter(
      item =>
        item.label.toLowerCase().includes(q) ||
        (item.description?.toLowerCase().includes(q) ?? false),
    );
  }

  get panelHasMore(): boolean {
    return this.panelSearchType === 'Api' && this.draggingList.length < this.panelTotalRecords;
  }

  // ── Existing computed state ────────────────────────────────────────────────
  get hasActions(): boolean {
    if (this.enableDragDrop) return this.canAdd || this.allowRemove;
    return this.canAdd || this.canDelete;
  }

  currentPage = 1;
  pageSizeOptions = [5, 10, 25, 50];

  get _total(): number {
    return this.datasource.length;
  }

  get totalPages(): number {
    return Math.ceil(this._total / this.pageSize) || 1;
  }

  get pagedData(): any[] {
    if (!this.isPaginated) return this.datasource;
    const start = (this.currentPage - 1) * this.pageSize;
    return this.datasource.slice(start, start + this.pageSize);
  }

  get startRecord(): number {
    return this._total === 0 ? 0 : (this.currentPage - 1) * this.pageSize + 1;
  }

  get endRecord(): number {
    return Math.min(this.currentPage * this.pageSize, this._total);
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

  get skeletonRows(): number[] {
    return Array.from({ length: Math.min(this.pageSize, 6) });
  }

  // ── Existing row methods ───────────────────────────────────────────────────
  addRow(): void {
    const newRow: any = {};
    this.columns.forEach(col => (newRow[col.key] = null));
    this.datasource = [...this.datasource, newRow];
    this.datasourceChange.emit(this.datasource);
    this.rowAdd.emit(newRow);
    if (this.isPaginated) {
      this.goToPage(this.totalPages);
    }
  }

  deleteRow(pagedIndex: number): void {
    const actualIndex = this.isPaginated
      ? (this.currentPage - 1) * this.pageSize + pagedIndex
      : pagedIndex;
    const row = this.datasource[actualIndex];
    this.datasource = this.datasource.filter((_, i) => i !== actualIndex);
    this.datasourceChange.emit(this.datasource);
    this.rowDelete.emit({ row, index: actualIndex });
    if (this.currentPage > this.totalPages) {
      this.currentPage = this.totalPages;
    }
  }

  onCellChange(row: any, col: OslFormGridColumn, value: any): void {
    row[col.key] = value;
    this.datasourceChange.emit(this.datasource);
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
  }

  onPageSizeChange(size: number): void {
    this.pageSize = Number(size);
    this.currentPage = 1;
  }

  isDisabled(elem: elements, row: any, index: number): boolean {
    return elem.disabledIf ? elem.disabledIf(row, index) : !!elem.disabled;
  }

  isLoading(row: any, elem: elements): boolean {
    return elem.loadingIf ? elem.loadingIf(row) : false;
  }

  colRequired(col: OslFormGridColumn): boolean {
    return !!col.formElem?.required || !!col.formElem?.requiredIf;
  }

  onSelectChange(col: OslFormGridColumn, row: any, i: number, value: any): void {
    if (!col.formElem?.change) return;
    const elem = col.formElem;
    let selectedObj: any = undefined;
    if (elem.datasource) {
      if (Array.isArray(value)) {
        selectedObj = value.map(v =>
          elem.datasource!.find(item => (elem.valueField ? item[elem.valueField] : item) === v) ?? null,
        );
      } else if (value !== null && value !== undefined) {
        selectedObj =
          elem.datasource.find(item =>
            (elem.valueField ? item[elem.valueField] : item) === value,
          ) ?? null;
      } else {
        selectedObj = null;
      }
    }
    elem.change!(row, i, selectedObj);
  }

  // ── Panel search / pagination methods ─────────────────────────────────────
  onPanelSearchChange(value: string): void {
    this.dragSearchQuery = value;
    if (this.panelSearchType !== 'Api') return;
    if (this._panelSearchDebounce !== null) clearTimeout(this._panelSearchDebounce);
    this._panelSearchDebounce = setTimeout(() => {
      this.panelCurrentPage = 1;
      this.panelSearch.emit({ searchValue: value, page: 1, pageSize: this.panelPageSize });
    }, 350);
  }

  clearPanelSearch(): void {
    this.dragSearchQuery = '';
    if (this.panelSearchType === 'Api') {
      this.panelCurrentPage = 1;
      this.panelSearch.emit({ searchValue: '', page: 1, pageSize: this.panelPageSize });
    }
  }

  loadMorePanelItems(): void {
    if (this.panelLoading || !this.panelHasMore) return;
    this.panelCurrentPage++;
    this.panelPageChange.emit({
      page: this.panelCurrentPage,
      pageSize: this.panelPageSize,
      searchValue: this.dragSearchQuery,
    });
  }

  // ── Drag & Drop methods ────────────────────────────────────────────────────

  /** Called when a panel item is dropped onto the grid overlay — always appends to end. */
  onPanelDrop(event: CdkDragDrop<never[]>): void {
    const dragItem: DragItem = event.item.data;
    const newRow: any = {};
    this.columns.forEach(col => (newRow[col.key] = null));
    if (dragItem.data) Object.assign(newRow, dragItem.data);
    this.datasource = [...this.datasource, newRow];
    this.datasourceChange.emit(this.datasource);
    this.itemDropped.emit({
      item: dragItem,
      previousIndex: event.previousIndex,
      currentIndex: this.datasource.length - 1,
      previousContainer: 'available',
      currentContainer: 'grid',
      row: newRow,
    });
    this.gridChanged.emit(this.datasource);
  }

  /** Called when a grid row is dropped within the grid — reorders only. */
  onGridReorder(event: CdkDragDrop<any[]>): void {
    if (event.previousContainer !== event.container) return;
    if (!this.allowReorder) return;
    const baseIndex = this.isPaginated ? (this.currentPage - 1) * this.pageSize : 0;
    const prevActual = baseIndex + event.previousIndex;
    const currActual = baseIndex + event.currentIndex;
    moveItemInArray(this.datasource, prevActual, currActual);
    this.datasource = [...this.datasource];
    this.datasourceChange.emit(this.datasource);
    this.itemMoved.emit({
      item: this.datasource[currActual],
      previousIndex: prevActual,
      currentIndex: currActual,
      previousContainer: 'grid',
      currentContainer: 'grid',
      row: this.datasource[currActual],
    });
    this.gridChanged.emit(this.datasource);
  }

  removeGridRow(pagedIndex: number): void {
    if (!this.allowRemove) return;
    const actualIndex = this.isPaginated
      ? (this.currentPage - 1) * this.pageSize + pagedIndex
      : pagedIndex;
    const row = this.datasource[actualIndex];
    this.datasource = this.datasource.filter((_, i) => i !== actualIndex);
    this.datasourceChange.emit(this.datasource);
    this.rowDelete.emit({ row, index: actualIndex });
    this.itemRemoved.emit({
      item: row,
      previousIndex: actualIndex,
      currentIndex: -1,
      previousContainer: 'grid',
      currentContainer: 'none',
      row,
    });
    this.gridChanged.emit(this.datasource);
    if (this.currentPage > this.totalPages) {
      this.currentPage = this.totalPages;
    }
  }

  selectGridItem(row: any, pagedIndex: number): void {
    const actualIndex = this.isPaginated
      ? (this.currentPage - 1) * this.pageSize + pagedIndex
      : pagedIndex;
    this.itemSelected.emit({
      item: row,
      previousIndex: actualIndex,
      currentIndex: actualIndex,
      previousContainer: 'grid',
      currentContainer: 'grid',
      row,
    });
  }

  onDragStartedEvent(_event: CdkDragStart, item: DragItem | any, source: string): void {
    this.isDragging = true;
    if (source === 'available') this.isDraggingFromPanel = true;
    this.dragStarted.emit({
      item,
      previousIndex: -1,
      currentIndex: -1,
      previousContainer: source,
      currentContainer: source,
    });
  }

  onDragEndedEvent(_event: CdkDragEnd, item: DragItem | any, source: string): void {
    this.isDragging = false;
    this.isDraggingFromPanel = false;
    this.dragEnded.emit({
      item,
      previousIndex: -1,
      currentIndex: -1,
      previousContainer: source,
      currentContainer: source,
    });
  }

  onDragEnteredEvent(event: CdkDragEnter, target: string): void {
    this.dragEntered.emit({
      item: event.item.data,
      previousIndex: -1,
      currentIndex: event.currentIndex,
      previousContainer: target === 'grid' ? 'available' : 'grid',
      currentContainer: target,
    });
  }

  onDragExitedEvent(event: CdkDragExit, target: string): void {
    this.dragExited.emit({
      item: event.item.data,
      previousIndex: -1,
      currentIndex: -1,
      previousContainer: target,
      currentContainer: target,
    });
  }
}
