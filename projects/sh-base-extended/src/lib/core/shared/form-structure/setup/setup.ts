import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  inject,
  Injector,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import { ShSetupStateService, ShSetupState } from './setup-state.service';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ShBulkAction, ShGrid, ShGridColumn, ShMenuAction, ShPageEvent, ShSortEvent } from '../grid/grid';
import { elements } from '../dynamic-form/dynamic-form';
import { DialogWrapper } from '../../../shared/components/dialog-wrapper/dialog-wrapper';
import { DeleteConfirmation, DeleteConfirmationData } from '../../../shared/components/delete-confirmation/delete-confirmation';
import { ShSearchbar } from '../searchbar/searchbar';
import { ActivatedRoute } from '@angular/router';
import { DomSanitizer } from '@angular/platform-browser';


export interface ShSetupSaveEvent {
  model: any;
  mode: 'add' | 'edit';
}

@Component({
  selector: 'sh-setup',
  standalone: false,
  templateUrl: './setup.html',
  styleUrl: './setup.scss',
})
export class ShSetup implements OnInit, OnChanges, AfterViewInit {
  private _injector = inject(Injector);
  private _stateService = inject(ShSetupStateService);
    private santizer = inject(DomSanitizer);
  private _cd = inject(ChangeDetectorRef);
  formLoading: boolean = false;
  saveLoading: boolean = false;
  saveAnotherLoading: boolean = false;
  restoredRow: any = null;
  private _pendingScrollTop: number | null = null;
  private _pendingCardScrollTop: number | null = null;
  private _isRestoring = false;
  private _pendingAutoEditId: string | null = null;

  @ViewChild('formBodyTpl') formBodyTpl!: TemplateRef<any>;
  @ViewChild('formFooterTpl') formFooterTpl!: TemplateRef<any>;
  @ViewChild('customFooterWrapperTpl') customFooterWrapperTpl!: TemplateRef<any>;
  @ViewChild('searchbar') searchbar?: ShSearchbar;
  @ViewChild('gridRef') gridRef: ShGrid | undefined;
  @ViewChild('cardGridRef') cardGridRef?: ElementRef<HTMLDivElement>;

  // ── Inputs ────────────────────────────────────────────────────
  @Input('title') title: string | undefined = '';
  @Input('titleIcon') titleIcon: string | undefined = '';
  @Input('columns') columns: ShGridColumn[] = [];
  @Input('datasource') datasource: any[] = [];
  @Input('isPaginated') isPaginated: boolean = true;
  @Input('pageSize') pageSize: number = 25;
  @Input('autoMode') autoMode: boolean = true;
  @Input('tableHeight') tableHeight: string = 'calc(100vh - 220px)';
  @Input('totalRecords') totalRecords: number = 0;
  @Input('loading') loading: boolean = false;
  @Input('dialogWidth') dialogWidth: string = '50vw';
  @Input('isDraggable') isDraggable: boolean = false;
  @Input('formElements') formElements: elements[] = [];
  @Input('beforeDisplay') beforeDisplay: ((model: any) => any | undefined) | undefined;
  @Input('onAddEditFn') onAddEditFn: ((row?: any) => void | undefined) | undefined;
  @Input('isLister') isLister: boolean = false;
  @Input('canAdd') canAdd: boolean = true;
  @Input('canEdit') canEdit: boolean = true;
  @Input('canDelete') canDelete: boolean = true;
  @Input('moreMenuActions') moreMenuActions: ShMenuAction[] = [];
  @Input('moreMenuHeaderActions') moreMenuHeaderActions: ShMenuAction[] = [];
  @Input('customFormFooter') customFormFooter: TemplateRef<any> | undefined;
  @Input('customHeaderTemp') customHeaderTemp: TemplateRef<any> | undefined;
  @Input('partialCustomHeaderTemp') partialCustomHeaderTemp: TemplateRef<any> | undefined;
  @Input('stateKey') stateKey: string = '';
  @Input('primaryKey') primaryKey: string = 'id';
  @Input('onSave') onSave: ((row?: any) => boolean | Promise<boolean> | undefined) | undefined;
  /** Fixed page size used for card view pagination. Defaults to pageSize. */
  @Input('cardPageSize') cardPageSize?: number;
  /** Optional custom card template. Context: { $implicit: row, index: number } */
  @Input('cardTemplate') cardTemplate?: TemplateRef<any>;
  /** Bootstrap col-* class number for each field in the card body. Default: 3 (4 per row). */
  @Input('cardCol') cardCol: number = 3;
  /** Passed straight through to sh-grid. When true, shows checkboxes for multi-row selection. */
  @Input('checkboxSelection') checkboxSelection: boolean = false;
  /** Passed straight through to sh-grid — set of primaryKey values currently checked. */
  @Input('selectedRowKeys') selectedRowKeys: Set<any> = new Set();

  // ── HubSpot extras ────────────────────────────────────────────
  /** 'panel' (default) opens Add/Edit in a HubSpot right-side panel; 'dialog' keeps the centred modal. */
  @Input('formMode') formMode: 'panel' | 'dialog' = 'panel';
  /** Width of the right-side panel. */
  @Input('panelWidth') panelWidth: string = '600px';
  /** Shows "Create and add another" in the add panel/dialog footer. */
  @Input('addAnother') addAnother: boolean = true;
  /** Shows the "+" Edit columns button in the table header (persisted with stateKey). */
  @Input('columnChooser') columnChooser: boolean = true;
  /** Actions for the selection bar shown when checkboxSelection rows are checked. */
  @Input('bulkActions') bulkActions: ShBulkAction[] = [];
  /** Singular noun for counts, e.g. 'contact' → "25 contacts", "1 contact selected". */
  @Input('recordLabel') recordLabel: string = 'record';
  /** Shows the Export button (downloads the current rows as CSV). */
  @Input('canExport') canExport: boolean = true;
  /** File name (without extension) used by Export. Defaults to the title. */
  @Input('exportFileName') exportFileName: string = '';
  /** Optional custom export handler. When provided, it replaces the built-in CSV download. Receives the current rows and visible columns. */
  @Input('exportCsvFn') exportCsvFn: ((rows: any[], columns: ShGridColumn[]) => void | Promise<void>) | undefined;
  /** Optional sub-heading under the title. */
  @Input('subtitle') subtitle: string = '';

  // ── Outputs ───────────────────────────────────────────────────
  @Output() onSearch = new EventEmitter<string>();
  @Output() onAdd = new EventEmitter<void>();
  @Output() onEdit = new EventEmitter<any>();
  @Output() onDelete = new EventEmitter<any>();
  @Output() pageChange = new EventEmitter<ShPageEvent>();
  @Output() pageSizeChange = new EventEmitter<ShPageEvent>();
  @Output() sortChange = new EventEmitter<ShSortEvent>();
  @Output() onRowClick = new EventEmitter<any>();
  @Output() onStateRestored = new EventEmitter<ShSetupState>();
  @Output() rowCheckToggle = new EventEmitter<{ row: any; checked: boolean }>();
  @Output() selectAllPageToggle = new EventEmitter<{ rows: any[]; checked: boolean }>();
  @Output() clearSelection = new EventEmitter<void>();
  @Output() columnsChange = new EventEmitter<ShGridColumn[]>();
  @Output() onExport = new EventEmitter<any[]>();

  // ── Dialog state ──────────────────────────────────────────────
  dialogModel: any = {};
  dialogMode: 'add' | 'edit' = 'add';
  public _dialogRef: MatDialogRef<any> | null = null;

  // ── View mode ─────────────────────────────────────────────────
  viewMode: 'table' | 'card' = 'table';

  // ── Card view state ───────────────────────────────────────────
  cardCurrentPage = 1;
  cardPageSizeOptions = [10, 25, 50, 100];
  cardOpenMenuIndex: number | null = null;
  cardMenuPosition = { top: 0, left: 0 };
  cardLoadingActionIndex: number | null = null;

  // ── Header more-actions menu state ─────────────────────────────
  headerMenuOpen: boolean = false;
  headerMenuPosition = { top: 0, left: 0 };
  headerLoadingActionIndex: number | null = null;

  @HostListener('document:click')
  onDocumentClick(): void {
    if (this.cardLoadingActionIndex === null) this.cardOpenMenuIndex = null;
    if (this.headerLoadingActionIndex === null) this.headerMenuOpen = false;
  }

  get hasForm(): boolean {
    return this.formElements?.length > 0 || !!this.onAddEditFn;
  }

  get _effectiveCardPageSize(): number {
    return this.cardPageSize ?? this.pageSize;
  }

  get _displayColumns(): ShGridColumn[] {
    return this.columns.filter(c => !c.isActions);
  }

  get cardTitleColumn(): ShGridColumn | undefined {
    return this._displayColumns[0];
  }

  get cardBodyColumns(): ShGridColumn[] {
    return this._displayColumns.slice(1);
  }

  get skeletonCardRows(): number[] {
    return Array.from({ length: 6 });
  }

  // ── Card pagination ───────────────────────────────────────────
  get _cardTotal(): number {
    return this.autoMode ? this.datasource.length : this.totalRecords;
  }

  get cardTotalPages(): number {
    return Math.ceil(this._cardTotal / this._effectiveCardPageSize) || 1;
  }

  get cardPagedData(): any[] {
    if (!this.autoMode) return this.datasource;
    const ps = this._effectiveCardPageSize;
    return this.datasource.slice((this.cardCurrentPage - 1) * ps, this.cardCurrentPage * ps);
  }

  get cardPageNumbers(): number[] {
    const total = this.cardTotalPages;
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const pages: number[] = [1];
    if (this.cardCurrentPage > 3) pages.push(-1);
    for (let i = Math.max(2, this.cardCurrentPage - 1); i <= Math.min(total - 1, this.cardCurrentPage + 1); i++) {
      pages.push(i);
    }
    if (this.cardCurrentPage < total - 2) pages.push(-1);
    pages.push(total);
    return pages;
  }

  get cardStartRecord(): number {
    if (this._cardTotal === 0) return 0;
    return (this.cardCurrentPage - 1) * this._effectiveCardPageSize + 1;
  }

  get cardEndRecord(): number {
    return Math.min(this.cardCurrentPage * this._effectiveCardPageSize, this._cardTotal);
  }

  cardGoToPage(page: number): void {
    if (page < 1 || page > this.cardTotalPages) return;
    this.cardCurrentPage = page;
    if (!this.autoMode) {
      this.pageChange.emit({ page, pageSize: this._effectiveCardPageSize, searchValue: this.searchbar?.searchControl?.value ?? '' });
    }
  }

  cardOnPageSizeChange(size: number): void {
    this.cardCurrentPage = 1;
    this.cardPageSize = size
    this.pageSizeChange.emit({ page: 1, pageSize: Number(size), searchValue: this.searchbar?.searchControl?.value ?? '' });
  }
  renderIcon(icon:string){
    return this.santizer.bypassSecurityTrustHtml(icon)
  }
  // ── Lifecycle ─────────────────────────────────────────────────
  ngOnInit(): void {
    this._loadViewMode();
    const route = this._injector.get(ActivatedRoute, null);
    if (route) {
      const id = route.snapshot.queryParamMap.get('id');
      if (id) this._pendingAutoEditId = id;
    }
  }

  ngAfterViewInit(): void {
    this.statemainTain();
    if (this._pendingAutoEditId !== null) {
      const id = this._pendingAutoEditId;
      this._pendingAutoEditId = null;
      if (id === '0') {
        setTimeout(() => this.openAddDialog());
      } else {
        setTimeout(() => this.openEditDialog({ [this.primaryKey]: id }));
      }
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['datasource']) {
      if (this.viewMode === 'card' && this.autoMode && !changes['datasource'].firstChange) {
        this.cardCurrentPage = 1;
      } else if (this.viewMode === 'card' && !this.autoMode && this._pendingCardScrollTop !== null) {
        const ds = changes['datasource'].currentValue;
        if (ds?.length > 0) {
          const top = this._pendingCardScrollTop;
          this._pendingCardScrollTop = null;
          setTimeout(() => {
            if (this.cardGridRef?.nativeElement) {
              this.cardGridRef.nativeElement.scrollTop = top;
            }
          }, 50);
        }
      } else if (this.viewMode === 'table' && this._pendingScrollTop !== null) {
        const ds = changes['datasource'].currentValue;
        if (ds?.length > 0) {
          const top = this._pendingScrollTop;
          this._pendingScrollTop = null;
          setTimeout(() => { this.gridRef?.scrollTo(top); }, 50);
        }
      }
    }
  }

  // ── View persistence ──────────────────────────────────────────
  private _getViewKey(): string {
    return this.stateKey ? `sh-view-${this.stateKey}` : '';
  }

  private _loadViewMode(): void {
    const key = this._getViewKey();
    if (!key) return;
    const saved = localStorage.getItem(key) as 'table' | 'card' | null;
    if (saved === 'card' || saved === 'table') {
      this.viewMode = saved;
    }
  }

  toggleView(mode: 'table' | 'card'): void {
    if (this.viewMode === mode) return;
    this.viewMode = mode;
    const key = this._getViewKey();
    if (key) localStorage.setItem(key, mode);

    if (mode === 'card') {
      this.cardCurrentPage = 1;
      if (!this.autoMode) {
        this.pageChange.emit({ page: 1, pageSize: this._effectiveCardPageSize, searchValue: this.searchbar?.searchControl?.value ?? '' });
      }
    } else {
      if (this.gridRef) this.gridRef.currentPage = 1;
      this.pageChange.emit({ page: 1, pageSize: this.pageSize, searchValue: this.searchbar?.searchControl?.value ?? '' });
    }
  }

  // ── Card helpers ──────────────────────────────────────────────
  toggleCardMenu(index: number, event: Event): void {
    event.stopPropagation();
    if (this.cardLoadingActionIndex !== null) return;
    if (this.cardOpenMenuIndex === index) { this.cardOpenMenuIndex = null; return; }
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const menuWidth = 190;
    const left = Math.min(Math.max(rect.right - menuWidth, 8), window.innerWidth - menuWidth - 8);
    this.cardMenuPosition = { top: rect.bottom + 6, left };
    this.cardOpenMenuIndex = index;
  }

  async onCardActionClick(action: ShMenuAction, row: any, index: number): Promise<void> {
    if (this.cardLoadingActionIndex !== null) return;
    this.cardLoadingActionIndex = index;
    try {
      await Promise.resolve(action.click(row));
    } finally {
      this.cardLoadingActionIndex = null;
      this.cardOpenMenuIndex = null;
      this._cd.markForCheck();
    }
  }

  get hasVisibleHeaderActions(): boolean {
    return this.moreMenuHeaderActions.some(a => !a.hideIf || !a.hideIf(undefined));
  }

  toggleHeaderMenu(event: Event): void {
    event.stopPropagation();
    if (this.headerLoadingActionIndex !== null) return;
    if (this.headerMenuOpen) {
      this.headerMenuOpen = false;
      return;
    }
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const menuWidth = 196;
    const left = Math.min(Math.max(rect.right - menuWidth, 8), window.innerWidth - menuWidth - 8);
    this.headerMenuPosition = { top: rect.bottom + 6, left };
    this.headerMenuOpen = true;
  }

  async onHeaderActionClick(action: ShMenuAction, index: number): Promise<void> {
    if (this.headerLoadingActionIndex !== null) return;
    this.headerLoadingActionIndex = index;
    try {
      await Promise.resolve(action.click(undefined));
    } finally {
      this.headerLoadingActionIndex = null;
      this.headerMenuOpen = false;
      this._cd.markForCheck();
    }
  }

  isHighlightedCard(row: any): boolean {
    if (!this.restoredRow || !this.primaryKey) return false;
    const val = row[this.primaryKey];
    return val !== undefined && val === this.restoredRow[this.primaryKey];
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

  getCardInitial(row: any): string {
    if (!this.cardTitleColumn) return '?';
    const val = this.getCellValue(row, this.cardTitleColumn);
    return val && val !== '--' ? val[0].toUpperCase() : '?';
  }

  hasVisibleActions(row: any): boolean {
    return this.moreMenuActions.some(a => !a.hideIf || !a.hideIf(row));
  }

  // ── State maintenance ─────────────────────────────────────────
  statemainTain() {
    if (!this.stateKey) return;
    const state = this._stateService.consume(this.stateKey);
    if (!state) return;

    this.restoredRow = state.highlightedRow;

    if (this.viewMode === 'card') {
      this.cardCurrentPage = state.page;
      if (this.searchbar && state.searchValue) {
        this._isRestoring = true;
        this.searchbar.searchControl.setValue(state.searchValue, { emitEvent: false });
      }
      if (state.searchValue) {
        this.onSearchSetup(state.searchValue);
      } else if (!this.autoMode) {
        this._pendingCardScrollTop = state.scrollTop;
        this.pageChange.emit({ page: state.page, pageSize: state.pageSize, searchValue: '' });
      } else if (state.scrollTop > 0) {
        setTimeout(() => {
          if (this.cardGridRef?.nativeElement) {
            this.cardGridRef.nativeElement.scrollTop = state.scrollTop;
          }
        }, 50);
      }
      this.onStateRestored.emit(state);
    } else {
      this._pendingScrollTop = state.scrollTop;
      if (this.gridRef) {
        this.gridRef.currentPage = state.page;
        this.gridRef.pageSize = state.pageSize;
        this.gridRef.setRestorePage(state.page);
      }
      if (this.searchbar && state.searchValue) {
        this._isRestoring = true;
        this.searchbar.searchControl.setValue(state.searchValue, { emitEvent: false });
      }
      if (state.searchValue) {
        this.onSearchSetup(state.searchValue);
      } else {
        this.pageChange.emit({ page: state.page, pageSize: state.pageSize, searchValue: '' });
      }
      this.onStateRestored.emit(state);
    }

    setTimeout(() => {
      this.restoredRow = null;
      this.gridRef?.clearRestorePage();
    }, 3000);
  }

  // ── Search ────────────────────────────────────────────────────
  onSearchSetup(event: any) {
    if (this.viewMode === 'card' && this.autoMode) {
      this.cardCurrentPage = 1;
      this.onSearch.emit(event);
      return;
    }

    if (this._isRestoring) {
      const restoredPage = this.viewMode === 'card' ? this.cardCurrentPage : (this.gridRef?.currentPage ?? 1);
      this._isRestoring = false;
      this.pageChange.emit({
        page: restoredPage,
        pageSize: this.viewMode === 'card' ? this._effectiveCardPageSize : (this.gridRef?.pageSize ?? this.pageSize),
        searchValue: event,
      });
      this.onSearch.emit(event);
      return;
    }

    if (this.viewMode === 'card') {
      this.cardCurrentPage = 1;
    }
    if (this.gridRef) {
      this.gridRef.clearRestorePage();
      this.gridRef.currentPage = 1;
    }
    this.pageChange.emit({
      page: 1,
      pageSize: this.viewMode === 'card' ? this._effectiveCardPageSize : (this.gridRef?.pageSize || 10),
      searchValue: event,
      sortASC: this.gridRef?.sortAsc,
      sortKey: this.gridRef?.sortKey,
    });
    this.onSearch.emit(event);
  }

  // ── Table helpers ─────────────────────────────────────────────
  get columnsWithActions(): ShGridColumn[] {
    if (!this.hasForm) return this.columns;
    if (this.isLister) return [...this.columns];
    if (!this.canEdit && !this.canDelete) return this.columns;
    return [{ key: '__actions', label: '', isActions: true }, ...this.columns];
  }

  onPageChange(eventEmitter: EventEmitter<ShPageEvent>, event: ShPageEvent) {
    eventEmitter.emit({ ...event, ...{
      searchValue: this.searchbar?.searchControl?.value,
      sortKey: this.gridRef?.sortKey,
      sortASC: this.gridRef?.sortAsc,
    }});
  }

  // ── Dialog actions ────────────────────────────────────────────
  async openAddDialog(): Promise<void> {
    this.dialogMode = 'add';
    if (this.beforeDisplay) {
      this.dialogModel = await this.beforeDisplay({});
    } else {
      this.dialogModel = {};
    }
    this.onAdd.emit();
    if (this.onAddEditFn) { this.onAddEditFn(); return; }
    this._openDialog();
  }

  async openEditDialog(row: any): Promise<void> {
    this.dialogMode = 'edit';
    if (this.stateKey) {
      this._stateService.save(this.stateKey, {
        page: this.viewMode === 'card' ? this.cardCurrentPage : (this.gridRef?.currentPage ?? 1),
        pageSize: this.viewMode === 'card' ? this._effectiveCardPageSize : (this.gridRef?.pageSize ?? this.pageSize),
        searchValue: this.searchbar?.searchControl?.value ?? '',
        scrollTop: this.viewMode === 'card' ? (this.cardGridRef?.nativeElement?.scrollTop ?? 0) : (this.gridRef?.getScrollTop() ?? 0),
        highlightedRow: row,
      });
    }
    this.onEdit.emit(row);
    if (this.onAddEditFn) { this.onAddEditFn(row); return; }
    this._openDialog();
    if (this.beforeDisplay) {
      this.formLoading = true;
      this.dialogModel = await this.beforeDisplay(row);
      this.formLoading = false;
    } else {
      this.dialogModel = { ...row };
    }
  }

  onDeleteClick(row: any): void {
    const dialogData: DeleteConfirmationData = {
      title: 'Delete 1 record?',
      message: `You're about to delete this ${this._singularTitle.toLowerCase() || 'record'}. This action can't be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
    };
    this._injector.get(MatDialog).open(DeleteConfirmation, {
      width: '450px',
      panelClass: 'sh-dialog-panel',
      data: dialogData,
      disableClose: true,
    }).afterClosed().subscribe((confirmed: boolean) => {
      if (confirmed) this.onDelete.emit(row);
    });
  }

  cancelDialog(): void {
    this._dialogRef?.close();
    this._dialogRef = null;
  }

  async saveDialog(addAnother: boolean = false) {
    let isSuccess: any = false;
    if (this.onSave) {
      if (addAnother) { this.saveAnotherLoading = true; } else { this.saveLoading = true; }
      try {
        isSuccess = await this.onSave({ model: { ...this.dialogModel }, mode: this.dialogMode });
      } finally {
        this.saveLoading = false;
        this.saveAnotherLoading = false;
      }
    }
    if (!isSuccess) return;
    if (addAnother && this.dialogMode === 'add') {
      // HubSpot "Create and add another": keep the panel open with a fresh form
      this.dialogModel = this.beforeDisplay ? await this.beforeDisplay({}) : {};
      this._cd.markForCheck();
      return;
    }
    this._dialogRef?.close();
    this._dialogRef = null;
  }

  // ── Export (HubSpot footer "Export") ──────────────────────────
  exportCsv(): void {
    const rows = this.datasource ?? [];
    this.onExport.emit(rows);
    const cols = (this.gridRef?.displayColumns ?? this.columns).filter(c => !c.isActions);
    if (typeof this.exportCsvFn === 'function') {
      this.exportCsvFn(rows, cols);
      return;
    }
    const esc = (v: any) => {
      const str = v === null || v === undefined ? '' : String(v);
      return /[",\n]/.test(str) ? '"' + str.replace(/"/g, '""') + '"' : str;
    };
    const lines = [cols.map(c => esc(c.label)).join(',')];
    rows.forEach(r => lines.push(cols.map(c => esc(this.getCellValue(r, c) === '--' ? '' : this.getCellValue(r, c))).join(',')));
    const blob = new Blob(['\ufeff' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(this.exportFileName || this.title || 'export').replace(/[^a-z0-9-_ ]/gi, '').trim() || 'export'}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  get recordCount(): number {
    return this.autoMode ? (this.datasource?.length ?? 0) : this.totalRecords;
  }

  get recordCountLabel(): string {
    const n = this.recordCount;
    const l = this.recordLabel || 'record';
    return `${n} ${n === 1 ? l : (l.endsWith('s') ? l : l + 's')}`;
  }

  onCardTitleClick(row: any, event: Event): void {
    if (this.isLister || !this.hasForm || !this.canEdit) return;
    event.stopPropagation();
    this.openEditDialog(row);
  }

  onClearSelectionSetup(): void {
    this.clearSelection.emit();
  }

  private get _singularTitle(): string {
    const t = this.title ?? '';
    return t.endsWith('ies') ? t.slice(0, -3) + 'y' : (t.endsWith('s') && !t.endsWith('ss') ? t.slice(0, -1) : t);
  }

  private _openDialog(): void {
    const isPanel = this.formMode === 'panel';
    const header = this.customHeaderTemp
      ?? (isPanel
        ? (this.dialogMode === 'add' ? 'Create ' : 'Edit ') + this._singularTitle
        : (this.dialogMode === 'add' ? 'Add ' : 'Edit ') + this.title);
    this._dialogRef = this._injector.get(MatDialog).open(DialogWrapper, {
      width: isPanel ? this.panelWidth : this.dialogWidth,
      maxWidth: isPanel ? '100vw' : '90vw',
      height: isPanel ? '100vh' : undefined,
      position: isPanel ? { right: '0', top: '0' } : undefined,
      panelClass: isPanel ? ['sh-side-panel'] : ['sh-dialog-panel'],
      backdropClass: isPanel ? 'sh-backdrop-light' : 'cdk-overlay-dark-backdrop',
      autoFocus: false,
      enterAnimationDuration: isPanel ? '280ms' : undefined,
      exitAnimationDuration: isPanel ? '200ms' : undefined,
      data: {
        header,
        partialHeader: this.partialCustomHeaderTemp,
        formBody: this.formBodyTpl,
        formFooter: this.customFormFooter ? this.customFooterWrapperTpl : this.formFooterTpl,
        isDraggable: isPanel ? false : this.isDraggable,
        variant: isPanel ? 'panel' : 'dialog',
      },
    });
    if (isPanel) {
      const ref = this._dialogRef;
      ref.beforeClosed().subscribe(() => ref.addPanelClass('sh-side-panel--closing'));
    }
    this._dialogRef.afterClosed().subscribe(() => {
      this.statemainTain();
    });
  }
}
