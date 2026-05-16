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
import { OslGrid, OslGridColumn, OslMenuAction, OslPageEvent, OslSortEvent } from '../grid/grid';
import { elements } from '../dynamic-form/dynamic-form';
import { DialogWrapper } from '../../../shared/components/dialog-wrapper/dialog-wrapper';
import { DeleteConfirmation, DeleteConfirmationData } from '../../../shared/components/delete-confirmation/delete-confirmation';
import { OslSearchbar } from '../searchbar/searchbar';

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
  formLoading:boolean = false
  saveLoading:boolean = false
  @ViewChild('formBodyTpl') formBodyTpl!: TemplateRef<any>;
  @ViewChild('formFooterTpl') formFooterTpl!: TemplateRef<any>;
  @ViewChild('customFooterWrapperTpl') customFooterWrapperTpl!: TemplateRef<any>;
  @ViewChild('searchbar') searchbar?: OslSearchbar;

  // ── Inputs ────────────────────────────────────────────────────
  @Input('title') title: string|undefined= '';
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
  @Input('beforeDisplay')beforeDisplay :((model: any) => any | undefined) | undefined;

  @Input('onAddEditFn') onAddEditFn:((row?: any) => void | undefined) | undefined;
  @Input('isLister') isLister:boolean = false
  @Input('canAdd') canAdd: boolean = true;
  @Input('canEdit') canEdit: boolean = true;
  @Input('canDelete') canDelete: boolean = true;
  @Input('moreMenuActions') moreMenuActions: OslMenuAction[] = []
  @Input('customFormFooter') customFormFooter: TemplateRef<any> | undefined
  @Input('customHeaderTemp') customHeaderTemp: TemplateRef<any> | undefined
  @Input('partialCustomHeaderTemp') partialCustomHeaderTemp: TemplateRef<any> | undefined

  // ── Outputs ───────────────────────────────────────────────────
  @Output() onSearch = new EventEmitter<string>();
  @Output() onAdd = new EventEmitter<void>();
  // @Output() onSave = new EventEmitter<OslSetupSaveEvent>();
  @Output() onEdit = new EventEmitter<any>();
  @Output() onDelete = new EventEmitter<any>();
  @Output() pageChange = new EventEmitter<OslPageEvent>();
  @Output() pageSizeChange = new EventEmitter<OslPageEvent>();
  @Output() sortChange = new EventEmitter<OslSortEvent>();
  @Output() onRowClick = new EventEmitter<any>();
@ViewChild('gridRef') gridRef:OslGrid | undefined
 @Input('onSave') onSave:((row?: any) => boolean | undefined) | undefined;


  // ── Dialog state ──────────────────────────────────────────────
  dialogModel: any = {};
  dialogMode: 'add' | 'edit' = 'add';
  private _dialogRef: MatDialogRef<any> | null = null;

  get hasForm(): boolean {
    return this.formElements?.length > 0 || !! this.onAddEditFn;
  }
   onSearchSetup(event:any){
    if(this.gridRef)this.gridRef.currentPage = 1
    this.pageChange.emit({
      page:1,
      pageSize:this.gridRef?.pageSize || 10,
      searchValue:event
    })
    this.onSearch.emit(event)

  }

  /** Prepends the actions column when formElements are provided. */
  get columnsWithActions(): OslGridColumn[] {
    if (!this.hasForm) return this.columns;
    if (this.isLister) return [...this.columns];
    if (!this.canEdit && !this.canDelete) return this.columns;
    return [{ key: '__actions', label: '', isActions: true }, ...this.columns];
  }
  onPageChange(eventEmitter:EventEmitter<OslPageEvent>,event:OslPageEvent){

    eventEmitter.emit({...event,searchValue:this.searchbar?.searchControl?.value})

  }

  openAddDialog(): void {
    this.dialogMode = 'add';
    if(this.beforeDisplay){
      this.dialogModel = this.beforeDisplay(this.dialogModel)
    }else{
      this.dialogModel = {};
    }
    this.onAdd.emit();
    if(this.onAddEditFn){
      this.onAddEditFn();
      return;
    }
    this._openDialog();
  }

async openEditDialog(row: any): Promise<void> {
    this.dialogMode = 'edit';
      this.onEdit.emit(row);
    if(this.onAddEditFn){
      this.onAddEditFn(row)
      return;
    }
    
    this._openDialog();
     if(this.beforeDisplay){
      // this.datasource.find(x=>x[this.primaryKey]==)
      this.formLoading = true
      this.dialogModel = await this.beforeDisplay(row)
      this.formLoading = false
    
    }else{
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
    let isSuccess:any = false
    if(this.onSave){
      this.saveLoading = true
      isSuccess = await this.onSave({ model: { ...this.dialogModel }, mode: this.dialogMode })
      
      this.saveLoading = false
    }
    if(isSuccess){
      this._dialogRef?.close();
      this._dialogRef = null;

    }
  }

  private _openDialog(): void {
    this._dialogRef = this._injector.get(MatDialog).open(DialogWrapper, {
      width: this.dialogWidth,
      maxWidth:'90vw',

      data: {
        header: this.customHeaderTemp ?? ((this.dialogMode === 'add' ? 'Add ' : 'Edit ') + this.title),
        partialHeader: this.partialCustomHeaderTemp,
        formBody: this.formBodyTpl,
        formFooter: this.customFormFooter ? this.customFooterWrapperTpl : this.formFooterTpl,
      },
    });
  }
}
