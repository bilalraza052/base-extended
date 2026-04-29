import { Component,EventEmitter,Input, Output } from '@angular/core';

@Component({
  selector: 'osl-input',
  standalone:false,
  templateUrl: './input.html',
  styleUrl: './input.scss',
})
export class Oslinput {
  @Input('label') label:string=""
  @Input('required') required:boolean = false
  @Input('disabled')disabled:boolean = false
  @Input('model') model:any = {}
  @Output() modelChange = new EventEmitter<any>();
  @Output() changeEv = new EventEmitter<any>();
  onModelChange(event:any){
    this.model=event;
    this.modelChange.emit(this.model)


  }
  
 
}
