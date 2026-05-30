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
  formLoading: boolean = false;
  saveLoading: boolean = false;
  restoredRow: any = null;
  private _pendingScrollTop: number | null = null;
  private _isRestoring = false;
  private _pendingAutoEditId: string | null = null;

  @ViewChild('formBodyTpl') formBodyTpl!: TemplateRef<any>;
  @ViewChild('formFooterTpl') formFooterTpl!: TemplateRef<any>;
  @ViewChild('customFooterWrapperTpl') customFooterWrapperTpl!: TemplateRef<any>;
  @ViewChild('searchbar') searchbar?: OslSearchbar;
  @ViewChild('gridRef') gridRef: OslGrid | undefined;
  @ViewChild('cardContainerRef') cardContainerRef?: ElementRef<HTMLDivElement>;

  // ── Inputs ────────────────────────────────────────────────────
  @Input('title') title: string | undefined = '';
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
  /** Fixed page size used for card view infinite scroll. Defaults to pageSize. */
  @Input('cardPageSize') cardPageSize?: number;
  /** Optional custom card template. Context: { $implicit: row, index: number } */
  @Input('cardTemplate') cardTemplate?: TemplateRef<any>;

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
  cardDatasource: any[] = [];
  cardPage = 0;
  allCardsLoaded = false;
  cardOpenMenuIndex: number | null = null;
  cardMenuPosition = { top: 0, left: 0 };
  private _cardExpectedPage = 0;
  private _cardRestoreTargetPage = 0;
  private _needsInitialCardLoad = false;

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

  // ── Lifecycle ─────────────────────────────────────────────────
  ngOnInit(): void {
    this._loadViewMode();
    if (this.viewMode === 'card') {
      this._needsInitialCardLoad = true;
    }
    const route = this._injector.get(ActivatedRoute, null);
    if (route) {
      const id = route.snapshot.queryParamMap.get('id');
      if (id) this._pendingAutoEditId = id;
    }
  }

  ngAfterViewInit(): void {
    this.statemainTain();
    if (this._needsInitialCardLoad) {
      this._needsInitialCardLoad = false;
      setTimeout(() => { this._startCardLoad(); });
    }
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
      if (this.viewMode === 'card') {
        if (this.autoMode) {
          // Local pagination: datasource changed (search filtered or initial load), reset
          if (!changes['datasource'].firstChange) {
            this._loadCardPageLocally(1);
          }
        } else if (this._cardExpectedPage !== 0) {
          const newData: any[] = changes['datasource'].currentValue ?? [];
          const isFirstPage = this._cardExpectedPage === 1;
          this._cardExpectedPage = 0;

          if (isFirstPage) {
            this.cardDatasource = [...newData];
            this.cardPage = 1;
            this.allCardsLoaded = false;
          } else if (newData.length > 0) {
            this.cardDatasource = [...this.cardDatasource, ...newData];
            this.cardPage++;
          }

          if (newData.length === 0 || (this.totalRecords > 0 && this.cardDatasource.length >= this.totalRecords)) {
            this.allCardsLoaded = true;
          }

          // Multi-page state restore: continue loading until target page is reached
          if (this._cardRestoreTargetPage > 0 && this.cardPage < this._cardRestoreTargetPage && !this.allCardsLoaded) {
            const nextPage = this.cardPage + 1;
            this._cardExpectedPage = nextPage;
            this.pageChange.emit({ page: nextPage, pageSize: this._effectiveCardPageSize, searchValue: this.searchbar?.searchControl?.value ?? '' });
          } else if (this._cardRestoreTargetPage > 0 && (this.cardPage >= this._cardRestoreTargetPage || this.allCardsLoaded)) {
            this._cardRestoreTargetPage = 0;
            if (this._pendingScrollTop !== null) {
              const top = this._pendingScrollTop;
              this._pendingScrollTop = null;
              setTimeout(() => { this.cardContainerRef?.nativeElement?.scrollTo({ top }); }, 50);
            }
          }
        } else if (!changes['datasource'].firstChange) {
          // External refresh (e.g. after approve/delete via more-actions) — replace cards with fresh data
          const newData: any[] = changes['datasource'].currentValue ?? [];
          this.cardDatasource = [...newData];
          this.cardPage = 1;
          this.allCardsLoaded = newData.length === 0
            || (this.totalRecords > 0 && newData.length >= this.totalRecords)
            || newData.length < this._effectiveCardPageSize;
        }
      } else if (this._pendingScrollTop !== null) {
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
      this._startCardLoad();
    } else {
      this._cardExpectedPage = 0;
      if (this.gridRef) this.gridRef.currentPage = 1;
      this.pageChange.emit({ page: 1, pageSize: this.pageSize, searchValue: this.searchbar?.searchControl?.value ?? '' });
    }
  }

  // ── Card view helpers ─────────────────────────────────────────
  private _startCardLoad(): void {
    this.cardDatasource = [];
    this.cardPage = 0;
    this.allCardsLoaded = false;
    this._cardRestoreTargetPage = 0;

    if (this.autoMode) {
      this._loadCardPageLocally(1);
    } else {
      this._cardExpectedPage = 1;
      this.pageChange.emit({ page: 1, pageSize: this._effectiveCardPageSize, searchValue: this.searchbar?.searchControl?.value ?? '' });
    }
  }

  private _loadCardPageLocally(page: number): void {
    const ps = this._effectiveCardPageSize;
    const slice = this.datasource.slice((page - 1) * ps, page * ps);
    if (page === 1) {
      this.cardDatasource = [...slice];
      this.allCardsLoaded = false;
    } else {
      this.cardDatasource = [...this.cardDatasource, ...slice];
    }
    this.cardPage = page;
    if (this.datasource.length > 0 && (this.cardDatasource.length >= this.datasource.length || slice.length < ps)) {
      this.allCardsLoaded = true;
    }
  }

  loadMoreCards(): void {
    if (this.loading || this.allCardsLoaded) return;

    if (this.autoMode) {
      if (this.cardDatasource.length >= this.datasource.length) { this.allCardsLoaded = true; return; }
      this._loadCardPageLocally(this.cardPage + 1);
      return;
    }

    if (this._cardExpectedPage !== 0) return;
    if (this.totalRecords > 0 && this.cardDatasource.length >= this.totalRecords) {
      this.allCardsLoaded = true;
      return;
    }
    const nextPage = this.cardPage + 1;
    this._cardExpectedPage = nextPage;
    this.pageChange.emit({ page: nextPage, pageSize: this._effectiveCardPageSize, searchValue: this.searchbar?.searchControl?.value ?? '' });
  }

  onCardScroll(event: Event): void {
    const el = event.target as HTMLElement;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 150) {
      this.loadMoreCards();
    }
  }

  isHighlightedCard(row: any): boolean {
    if (!this.restoredRow || !this.primaryKey) return false;
    const val = row[this.primaryKey];
    return val !== undefined && val === this.restoredRow[this.primaryKey];
  }

  toggleCardMenu(index: number, event: Event): void {
    event.stopPropagation();
    if (this.cardOpenMenuIndex === index) { this.cardOpenMenuIndex = null; return; }
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const menuWidth = 190;
    const left = Math.min(Math.max(rect.right - menuWidth, 8), window.innerWidth - menuWidth - 8);
    this.cardMenuPosition = { top: rect.bottom + 6, left };
    this.cardOpenMenuIndex = index;
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

    this._pendingScrollTop = state.scrollTop;
    this.restoredRow = state.highlightedRow;

    if (this.viewMode === 'card') {
      this._needsInitialCardLoad = false;
      this.cardDatasource = [];
      this.cardPage = 0;
      this.allCardsLoaded = false;

      if (this.autoMode) {
        // Restore pages locally from current datasource
        const targetCount = state.page * this._effectiveCardPageSize;
        this.cardDatasource = this.datasource.slice(0, targetCount);
        this.cardPage = state.page;
        this.allCardsLoaded = this.cardDatasource.length >= this.datasource.length;
        if (this._pendingScrollTop !== null) {
          const top = this._pendingScrollTop;
          this._pendingScrollTop = null;
          setTimeout(() => { this.cardContainerRef?.nativeElement?.scrollTo({ top }); }, 50);
        }
        this.onStateRestored.emit(state);
      } else {
        this._cardRestoreTargetPage = state.page;

        if (this.searchbar && state.searchValue) {
          this._isRestoring = true;
          this.searchbar.searchControl.setValue(state.searchValue, { emitEvent: false });
        }

        this._cardExpectedPage = 1;
        if (state.searchValue) {
          this.onSearchSetup(state.searchValue);
        } else {
          this.pageChange.emit({ page: 1, pageSize: this._effectiveCardPageSize, searchValue: '' });
        }
        this.onStateRestored.emit(state);
      }
    } else {
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
      // Local mode: parent filters datasource; ngOnChanges will repopulate cards
      this.onSearch.emit(event);
      return;
    }

    if (this.viewMode === 'card') {
      this.cardDatasource = [];
      this.cardPage = 0;
      this.allCardsLoaded = false;
      this._cardExpectedPage = 1;
    }

    if (this._isRestoring) {
      const restoredPage = this.viewMode === 'card' ? 1 : (this.gridRef?.currentPage ?? 1);
      this._isRestoring = false;
      this.pageChange.emit({
        page: restoredPage,
        pageSize: this.viewMode === 'card' ? this._effectiveCardPageSize : (this.gridRef?.pageSize ?? this.pageSize),
        searchValue: event,
      });
      this.onSearch.emit(event);
      return;
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
        page: this.viewMode === 'card' ? this.cardPage : (this.gridRef?.currentPage ?? 1),
        pageSize: this.viewMode === 'card' ? this._effectiveCardPageSize : (this.gridRef?.pageSize ?? this.pageSize),
        searchValue: this.searchbar?.searchControl?.value ?? '',
        scrollTop: this.viewMode === 'card'
          ? (this.cardContainerRef?.nativeElement?.scrollTop ?? 0)
          : (this.gridRef?.getScrollTop() ?? 0),
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
