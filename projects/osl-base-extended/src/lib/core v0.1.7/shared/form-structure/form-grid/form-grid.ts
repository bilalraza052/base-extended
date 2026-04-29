import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { elements } from '../dynamic-form/dynamic-form';

export interface OslFormGridColumn {
  key: string;
  displayName: string;
  label?: string;
  /** When provided, renders the dynamic-form element in the cell bound to row[key]. */
  formElem?: elements;
  /** Optional CSS width, e.g. '150px' or '20%'. */
  width?: string;
}

export interface OslFormGridRowEvent {
  row: any;
  index: number;
}

@Component({
  selector: 'osl-form-grid',
  standalone: false,
  templateUrl: './form-grid.html',
  styleUrl: './form-grid.scss',
})
export class OslFormGrid implements OnChanges {
  @Input('columns') columns: OslFormGridColumn[] = [];
  @Input('datasource') datasource: any[] = [];
  @Output() datasourceChange = new EventEmitter<any[]>();

  @Input('isPaginated') isPaginated: boolean = false;
  @Input('pageSize') pageSize: number = 10;
  @Input('canAdd') canAdd: boolean = true;
  @Input('canDelete') canDelete: boolean = true;
  @Input('addLabel') addLabel: string = 'Add Row';
  @Input('loading') loading: boolean = false;

  @Output() rowAdd = new EventEmitter<any>();
  @Output() rowDelete = new EventEmitter<OslFormGridRowEvent>();

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

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['datasource']) {
      this.currentPage = 1;
    }
  }

  addRow(): void {
    const newRow: any = {};
    this.columns.forEach(col => (newRow[col.key] = null));
    this.datasource = [...this.datasource, newRow];
    this.datasourceChange.emit(this.datasource);
    this.rowAdd.emit(newRow);
    if (this.isPaginated) {
      this.currentPage = this.totalPages;
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
    if (col.formElem?.change) col.formElem.change(row);
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
  }

  onPageSizeChange(size: number): void {
    this.pageSize = Number(size);
    this.currentPage = 1;
  }

  isDisabled(row: any, elem: elements): boolean {
    return elem.disabledIf ? elem.disabledIf() : !!elem.disabled;
  }

  isRequired(row: any, elem: elements): boolean {
    return elem.requiredIf ? elem.requiredIf(row) : !!elem.required;
  }

  isLoading(row: any, elem: elements): boolean {
    return elem.loadingIf ? elem.loadingIf(row) : false;
  }

  colLabel(col: OslFormGridColumn): string {
    return col.label ?? col.displayName;
  }
}
