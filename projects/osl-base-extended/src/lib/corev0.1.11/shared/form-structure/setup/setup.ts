import {
  Component,
  EventEmitter,
  inject,
  Injector,
  Input,
  Output,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { OslGridColumn, OslPageEvent, OslSortEvent } from '../grid/grid';
import { elements } from '../dynamic-form/dynamic-form';
import { DialogWrapper } from '../../components/dialog-wrapper/dialog-wrapper';
import { DeleteConfirmation, DeleteConfirmationData } from '../../components/delete-confirmation/delete-confirmation';

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
export class OslSetup {
  private _injector = inject(Injector);

  @ViewChild('formBodyTpl') formBodyTpl!: TemplateRef<any>;
  @ViewChild('formFooterTpl') formFooterTpl!: TemplateRef<any>;

  // ── Inputs ────────────────────────────────────────────────────
  @Input('title') title: string = '';
  @Input('columns') columns: OslGridColumn[] = [];
  @Input('datasource') datasource: any[] = [];
  @Input('isPaginated') isPaginated: boolean = true;
  @Input('pageSize') pageSize: number = 25;
  @Input('autoMode') autoMode: boolean = true;
  @Input('tableHeight') tableHeight: string = 'calc(100vh - 220px)';
  @Input('totalRecords') totalRecords: number = 0;
  @Input('loading') loading: boolean = false;
  @Input('dialogWidth') dialogWidth: string = "50vw";
  /** Dynamic form elements — when provided, enables Add/Edit dialog and action column. */
  @Input('formElements') formElements: elements[] = [];

  @Input('onAddEditFn') onAddEditFn:((row?: any) => void | undefined) | undefined;

  // ── Outputs ───────────────────────────────────────────────────
  @Output() onSearch = new EventEmitter<string>();
  @Output() onAdd = new EventEmitter<void>();
  @Output() onSave = new EventEmitter<OslSetupSaveEvent>();
  @Output() onEdit = new EventEmitter<any>();
  @Output() onDelete = new EventEmitter<any>();
  @Output() pageChange = new EventEmitter<OslPageEvent>();
  @Output() pageSizeChange = new EventEmitter<OslPageEvent>();
  @Output() sortChange = new EventEmitter<OslSortEvent>();
  @Output() onRowClick = new EventEmitter<any>();

  // ── Dialog state ──────────────────────────────────────────────
  dialogModel: any = {};
  dialogMode: 'add' | 'edit' = 'add';
  private _dialogRef: MatDialogRef<any> | null = null;

  get hasForm(): boolean {
    return this.formElements?.length > 0;
  }

  /** Prepends the actions column when formElements are provided. */
  get columnsWithActions(): OslGridColumn[] {
    if (!this.hasForm) return this.columns;
    return [{ key: '__actions', label: '', isActions: true }, ...this.columns];
  }

  openAddDialog(): void {
    this.dialogMode = 'add';
    this.dialogModel = {};
    this.onAdd.emit();
    if(this.onAddEditFn){
      this.onAddEditFn();
      return;
    }
    this._openDialog();
  }

  openEditDialog(row: any): void {
    this.dialogMode = 'edit';
    this.dialogModel = { ...row };
    this.onEdit.emit(row);
    if(this.onAddEditFn){
      this.onAddEditFn(row)
      return;
    }
    this._openDialog();
  }

  onDeleteClick(row: any): void {
    const dialogData: DeleteConfirmationData = {
      title: 'Delete ' + this.title,
      message: `Are you sure you want to delete this ${this.title.toLowerCase()}? This action cannot be undone.`,
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

  saveDialog(): void {
    this.onSave.emit({ model: { ...this.dialogModel }, mode: this.dialogMode });
    this._dialogRef?.close();
    this._dialogRef = null;
  }

  private _openDialog(): void {
    this._dialogRef = this._injector.get(MatDialog).open(DialogWrapper, {
      width: this.dialogWidth,
      maxWidth:'90vw',

      data: {
        header: (this.dialogMode === 'add' ? 'Add ' : 'Edit ') + this.title,
        formBody: this.formBodyTpl,
        formFooter: this.formFooterTpl,
      },
    });
  }
}
