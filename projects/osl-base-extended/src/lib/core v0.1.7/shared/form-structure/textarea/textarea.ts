import { Component,EventEmitter,Input, Output } from '@angular/core';

@Component({
  selector: 'osl-textarea',
  standalone:false,
  templateUrl: './textarea.html',
  styleUrl: './textarea.scss',
})
export class Osltextarea {
  textareaRows:string = "3";
  @Input('label') label:string=""
  @Input('rows') rows:string="10"
  @Input('required') required:boolean = false
  @Input('disabled')disabled:boolean = false
  @Input('model') model:any = {}
  @Output() modelChange = new EventEmitter<any>();
  @Output() changeEv = new EventEmitter<any>();
  onModelChange(event:any){
    this.model=event;
    this.modelChange.emit(this.model)


  }
  ngAfterViewInit(){
    if(this.rows){
      this.textareaRows = this.rows

    }
  }
  
 
}
