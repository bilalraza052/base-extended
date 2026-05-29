import { ChangeDetectorRef, Component, Input } from '@angular/core';
import { OslGridColumn, OslPageEvent } from '../grid/grid';
import { MatDialogRef } from '@angular/material/dialog';
import { HttpResponse } from '../../../http/httpbase';

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
  constructor(public dialogRef: MatDialogRef<OslAutocompleteLister>,public cd:ChangeDetectorRef){
   
    

  }
  async ngAfterViewInit(){
     this.autocompleteData = this.data?.data 
         this.loader = true
    await this.getConfig()
    this.onPageChange()
    // await this.search()
    // this.loader = false
      this.cd.markForCheck()

  }
  async getConfig(){
    const res:HttpResponse = await this.autocompleteData.service[this.autocompleteData.configMethodName || 'getConfig']();
    if(!res.isSuccessful) return;
    this.column = res.result
  }

  async search(searchValue?:any,page = 1 , pageSize = 25){ 
      this.loader = true
    const res:HttpResponse = await this.autocompleteData.service[this.autocompleteData.methodName || 'Search']({
      page:page,
      pageSize:pageSize,
      searchValue
    });
   
      this.cd.markForCheck()

    if(!res.isSuccessful) return;
    this.datasource = res.result?.data || []
    setTimeout(()=>{
      this.loader = false

    },20)
    this.recordCount = res.result?.recordsFiltered
    // this.recordCount = Number(res.headers?.get('recordCount')|| 0)
  }
  onPageChange(event?:OslPageEvent){
    this.search(event?.searchValue,event?.page,event?.pageSize)

  }
  onSearch(value:string){
    this.search(value)
  }
 
  onRowClick(event:any){
    
    this.dialogRef.close(event)
    
  }
 

}

export type { oslListerData } from './autocomplete-lister-types';