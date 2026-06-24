import {
  AfterViewInit,
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
import { OslSetupStateService, OslSetupState } from './setup-state.service';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { OslGrid, OslGridColumn, OslMenuAction, OslPageEvent, OslSortEvent } from '../grid/grid';
import { elements } from '../dynamic-form/dynamic-form';
import { DialogWrapper } from '../../../shared/components/dialog-wrapper/dialog-wrapper';
import { DeleteConfirmation, DeleteConfirmationData } from '../../../shared/components/delete-confirmation/delete-confirmation';
import { OslSearchbar } from '../searchbar/searchbar';
import { ActivatedRoute } from '@angular/router';
import { DomSanitizer } from '@angular/platform-browser';

export interface OslSetupSaveEvent {
  model: any;
  mode: 'add' | 'edit';
}

@Component({
  selector: 'osl-setup',
  standalone: false,
  templateUrl: './setup.html',
  styleUrl: './setup.scss',
})
export class OslSetup implements OnInit, OnChanges, AfterViewInit {
  private _injector = inject(Injector);
  private _stateService = inject(OslSetupStateService);
  private santizer = inject(DomSanitizer);
  formLoading: boolean = false;
  saveLoading: boolean = false;
  restoredRow: any = null;
  private _pendingScrollTop: number | null = null;
  private _pendingCardScrollTop: number | null = null;
  private _isRestoring = false;
  private _pendingAutoEditId: string | null = null;

  @ViewChild('formBodyTpl') formBodyTpl!: TemplateRef<any>;
  @ViewChild('formFooterTpl') formFooterTpl!: TemplateRef<any>;
  @ViewChild('customFooterWrapperTpl') customFooterWrapperTpl!: TemplateRef<any>;
  @ViewChild('searchbar') searchbar?: OslSearchbar;
  @ViewChild('gridRef') gridRef: OslGrid | undefined;
  @ViewChild('cardGridRef') cardGridRef?: ElementRef<HTMLDivElement>;

  // ── Inputs ────────────────────────────────────────────────────
  @Input('title') title: string | undefined = '';
  @Input('titleIcon') titleIcon: string | undefined = '';
  @Input('columns') columns: OslGridColumn[] = [];
  @Input('datasource') datasource: any[] = [];
  @Input('isPaginated') isPaginated: boolean = true;
  @Input('pageSize') pageSize: number = 25;
  @Input('autoMode') autoMode: boolean = true;
  @Input('tableHeight') tableHeight: string = 'calc(100vh - 220px)';
  @Input('totalRecords') totalRecords: number = 0;
  @Input('loading') loading: boolean = false;
  @Input('dialogWidth') dialogWidth: string = '50vw';
  @Input('formElements') formElements: elements[] = [];
  @Input('beforeDisplay') beforeDisplay: ((model: any) => any | undefined) | undefined;
  @Input('onAddEditFn') onAddEditFn: ((row?: any) => void | undefined) | undefined;
  @Input('isLister') isLister: boolean = false;
  @Input('canAdd') canAdd: boolean = true;
  @Input('canEdit') canEdit: boolean = true;
  @Input('canDelete') canDelete: boolean = true;
  @Input('moreMenuActions') moreMenuActions: OslMenuAction[] = [];
  @Input('customFormFooter') customFormFooter: TemplateRef<any> | undefined;
  @Input('customHeaderTemp') customHeaderTemp: TemplateRef<any> | undefined;
  @Input('partialCustomHeaderTemp') partialCustomHeaderTemp: TemplateRef<any> | undefined;
  @Input('stateKey') stateKey: string = '';
  @Input('primaryKey') primaryKey: string = 'id';
  @Input('onSave') onSave: ((row?: any) => boolean | undefined) | undefined;
  /** Fixed page size used for card view pagination. Defaults to pageSize. */
  @Input('cardPageSize') cardPageSize?: number;
  /** Optional custom card template. Context: { $implicit: row, index: number } */
  @Input('cardTemplate') cardTemplate?: TemplateRef<any>;
  /** Bootstrap col-* class number for each field in the card body. Default: 3 (4 per row). */
  @Input('cardCol') cardCol: number = 3;

  // ── Outputs ───────────────────────────────────────────────────
  @Output() onSearch = new EventEmitter<string>();
  @Output() onAdd = new EventEmitter<void>();
  @Output() onEdit = new EventEmitter<any>();
  @Output() onDelete = new EventEmitter<any>();
  @Output() pageChange = new EventEmitter<OslPageEvent>();
  @Output() pageSizeChange = new EventEmitter<OslPageEvent>();
  @Output() sortChange = new EventEmitter<OslSortEvent>();
  @Output() onRowClick = new EventEmitter<any>();
  @Output() onStateRestored = new EventEmitter<OslSetupState>();

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

  @HostListener('document:click')
  onDocumentClick(): void {
    this.cardOpenMenuIndex = null;
  }

  get hasForm(): boolean {
    return this.formElements?.length > 0 || !!this.onAddEditFn;
  }

  get _effectiveCardPageSize(): number {
    return this.cardPageSize ?? this.pageSize;
  }

  get _displayColumns(): OslGridColumn[] {
    return this.columns.filter(c => !c.isActions);
  }

  get cardTitleColumn(): OslGridColumn | undefined {
    return this._displayColumns[0];
  }

  get cardBodyColumns(): OslGridColumn[] {
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
    return this.stateKey ? `osl-view-${this.stateKey}` : '';
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
    if (this.cardOpenMenuIndex === index) { this.cardOpenMenuIndex = null; return; }
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const menuWidth = 190;
    const left = Math.min(Math.max(rect.right - menuWidth, 8), window.innerWidth - menuWidth - 8);
    this.cardMenuPosition = { top: rect.bottom + 6, left };
    this.cardOpenMenuIndex = index;
  }

  isHighlightedCard(row: any): boolean {
    if (!this.restoredRow || !this.primaryKey) return false;
    const val = row[this.primaryKey];
    return val !== undefined && val === this.restoredRow[this.primaryKey];
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
    });
    this.onSearch.emit(event);
  }

  // ── Table helpers ─────────────────────────────────────────────
  get columnsWithActions(): OslGridColumn[] {
    if (!this.hasForm) return this.columns;
    if (this.isLister) return [...this.columns];
    if (!this.canEdit && !this.canDelete) return this.columns;
    return [{ key: '__actions', label: '', isActions: true }, ...this.columns];
  }

  onPageChange(eventEmitter: EventEmitter<OslPageEvent>, event: OslPageEvent) {
    eventEmitter.emit({ ...event, searchValue: this.searchbar?.searchControl?.value });
  }

  // ── Dialog actions ────────────────────────────────────────────
  openAddDialog(): void {
    this.dialogMode = 'add';
    if (this.beforeDisplay) {
      this.dialogModel = this.beforeDisplay(this.dialogModel);
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
      title: 'Delete ' + this.title,
      message: `Are you sure you want to delete this ${this.title?.toLowerCase()}? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
    };
    this._injector.get(MatDialog).open(DeleteConfirmation, {
      width: '380px',
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

  async saveDialog() {
    let isSuccess: any = false;
    if (this.onSave) {
      this.saveLoading = true;
      isSuccess = await this.onSave({ model: { ...this.dialogModel }, mode: this.dialogMode });
      this.saveLoading = false;
    }
    if (isSuccess) {
      this._dialogRef?.close();
      this._dialogRef = null;
    }
  }

  private _openDialog(): void {
    this._dialogRef = this._injector.get(MatDialog).open(DialogWrapper, {
      width: this.dialogWidth,
      maxWidth: '90vw',
      data: {
        header: this.customHeaderTemp ?? ((this.dialogMode === 'add' ? 'Add ' : 'Edit ') + this.title),
        partialHeader: this.partialCustomHeaderTemp,
        formBody: this.formBodyTpl,
        formFooter: this.customFormFooter ? this.customFooterWrapperTpl : this.formFooterTpl,
      },
    });
    this._dialogRef.afterClosed().subscribe(() => {
      this.statemainTain();
    });
  }
}
