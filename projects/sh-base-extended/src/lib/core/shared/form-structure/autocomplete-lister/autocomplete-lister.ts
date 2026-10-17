import { ChangeDetectorRef, Component, Input, ViewChild } from '@angular/core';
import { ShGridColumn, ShPageEvent, ShSortEvent } from '../grid/grid';
import { MatDialogRef } from '@angular/material/dialog';
import { HttpResponse } from '../../../http/httpbase';
import { ShSetup } from '../setup/setup';

@Component({
  selector: 'sh-autocomplete-lister',
  standalone:false,
  templateUrl: './autocomplete-lister.html',
  styleUrl: './autocomplete-lister.scss',
})
export class ShAutocompleteLister {
  @Input('data') data:any;
  column:ShGridColumn[]=[]
  datasource=[]
  autocompleteData:any;
  recordCount: number=0;
  loader: boolean = false;
  selectedMap = new Map<any, any>();
  @ViewChild('setup') setup!:ShSetup
  constructor(public dialogRef: MatDialogRef<ShAutocompleteLister>,public cd:ChangeDetectorRef){



  }
  async ngAfterViewInit(){
     this.autocompleteData = this.data?.data
    if (this.autocompleteData?.multiple) {
      for (const row of this.autocompleteData.selected || []) {
        this.selectedMap.set(row[this.autocompleteData.valueField], row);
      }
    }
         this.loader = true
    await this.getConfig()
    await this.search()
    this.loader = false
      this.cd.markForCheck()

  }

  get selectedRowKeys(): Set<any> {
    return new Set(this.selectedMap.keys());
  }

  onRowCheckToggle(event: { row: any; checked: boolean }): void {
    const key = event.row[this.autocompleteData.valueField];
    if (event.checked) {
      this.selectedMap.set(key, event.row);
    } else {
      this.selectedMap.delete(key);
    }
  }

  onSelectAllPageToggle(event: { rows: any[]; checked: boolean }): void {
    for (const row of event.rows) {
      const key = row[this.autocompleteData.valueField];
      if (event.checked) {
        this.selectedMap.set(key, row);
      } else {
        this.selectedMap.delete(key);
      }
    }
  }

  clearSelection(): void {
    this.selectedMap.clear();
  }

  applySelection(): void {
    this.dialogRef.close(Array.from(this.selectedMap.values()));
  }
  async getConfig(){
    const res:HttpResponse = await this.autocompleteData.service[this.autocompleteData.configMethodName || 'getConfig']();
    if(!res.isSuccessful) return;
    this.column = res.result
  }

  async search(searchValue?:any,page = 1 , pageSize = 25,sortKey?:string,sortColumnDirection?:string){ 
      this.loader = true
    const res:HttpResponse = await this.autocompleteData.service[this.autocompleteData.methodName || 'Search']({
      page:page,
      pageSize:pageSize,
      searchValue,
      sortColumn:sortKey,
      sortColumnDirection:sortColumnDirection,
      apiBody:this.autocompleteData.apiBody
    });
   
      this.cd.markForCheck()

    if(!res.isSuccessful) return;
    this.datasource = res.result?.data || []
    setTimeout(()=>{
      this.loader = false
      this.cd.markForCheck()
    },20)
       this.recordCount = res.result?.total || res.result?.recordsFiltered

  }
  async onSortChange(event:ShSortEvent){
    if(this.setup?.gridRef && this.setup?.searchbar){
      this.setup.gridRef.currentPage  = 1
      await this.search(this.setup.searchbar?.searchQuery,1,this.setup?.gridRef?.pageSize,event.key,event.asc == true ?'ASC':'DESC')
      this.cd.detectChanges();
      this.cd.markForCheck()

    }


  }
  onPageChange(event:ShPageEvent){
    this.search(event.searchValue,event.page,event.pageSize,event.sortKey,event.sortASC == true ? 'ASC' : 'DESC')

  }
  onSearch(value:string){
    this.search(value)
  }
 
  onRowClick(event:any){
    if (this.autocompleteData?.multiple) {
      const key = event[this.autocompleteData.valueField];
      this.onRowCheckToggle({ row: event, checked: !this.selectedMap.has(key) });
      return;
    }
    this.dialogRef.close(event)

  }
 

}

export type { shListerData } from './autocomplete-lister-types';