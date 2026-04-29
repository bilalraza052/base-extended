import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';

export interface OslGridColumn {
  key: string;
  label: string;
  enums?: { value: any; label: string }[];
  displayFn?: (value: any, row: any) => string;
  /** When true, renders edit + delete icon buttons instead of cell text. */
  isActions?: boolean;
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
      this.currentPage = 1;
    }
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
    this.currentPage = page;
    this.pageChange.emit({ page: this.currentPage, pageSize: this.pageSize });
  }

  onPageSizeChange(size: number): void {
    this.pageSize = Number(size);
    this.currentPage = 1;
    this.pageSizeChange.emit({ page: this.currentPage, pageSize: this.pageSize });
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
