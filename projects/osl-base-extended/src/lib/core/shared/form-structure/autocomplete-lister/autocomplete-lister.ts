import { ChangeDetectorRef, Component, Input, ViewChild } from '@angular/core';
import { OslGridColumn, OslPageEvent, OslSortEvent } from '../grid/grid';
import { MatDialogRef } from '@angular/material/dialog';
import { HttpResponse } from '../../../http/httpbase';
import { OslSetup } from '../setup/setup';

@Component({
  selector: 'osl-autocomplete-lister',
  standalone:false,
  templateUrl: './autocomplete-lister.html',
  styleUrl: './autocomplete-lister.scss',
})
export class OslAutocompleteLister {
  @Input('data') data:any;
  column:OslGridColumn[]=[]
  datasource=[]
  autocompleteData:any;
  recordCount: number=0;
  loader: boolean = false;
  @ViewChild('setup') setup!:OslSetup
  constructor(public dialogRef: MatDialogRef<OslAutocompleteLister>,public cd:ChangeDetectorRef){
   
    

  }
  async ngAfterViewInit(){
     this.autocompleteData = this.data?.data 
         this.loader = true
    await this.getConfig()
    await this.search()
    this.loader = false
      this.cd.markForCheck()

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
      sortColumnDirection:sortColumnDirection
    });
   
      this.cd.markForCheck()

    if(!res.isSuccessful) return;
    this.datasource = res.result?.data || []
    setTimeout(()=>{
      this.loader = false

    },20)
       this.recordCount = res.result?.total || res.result?.recordsFiltered

  }
  async onSortChange(event:OslSortEvent){
    if(this.setup?.gridRef && this.setup?.searchbar){
      this.setup.gridRef.currentPage  = 1
      await this.search(this.setup.searchbar?.searchQuery,1,this.setup?.gridRef?.pageSize,event.key,event.asc == true ?'ASC':'DESC')
      this.cd.detectChanges();
      this.cd.markForCheck()

    }


  }
  onPageChange(event:OslPageEvent){
    this.search(event.searchValue,event.page,event.pageSize,event.sortKey,event.sortASC == true ? 'ASC' : 'DESC')

  }
  onSearch(value:string){
    this.search(value)
  }
 
  onRowClick(event:any){
    
    this.dialogRef.close(event)
    
  }
 

}

export type { oslListerData } from './autocomplete-lister-types';