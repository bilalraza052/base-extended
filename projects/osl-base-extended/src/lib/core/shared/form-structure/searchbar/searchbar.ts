import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

import { FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
@Component({
  selector: 'osl-searchbar',
  standalone:false,
  templateUrl: './searchbar.html',
  styleUrl: './searchbar.scss',
})
export class OslSearchbar implements OnInit {
  @Input('label') label:string="Type to Search..."
  @Output() onSearch = new EventEmitter<any>();

  searchQuery:string=""
  focused = false;


searchControl = new FormControl('');
onKeyChange(){
  if(!this.searchQuery){
    this.onSearch.emit(this.searchQuery)
  }
}

clearSearch(){
  this.searchQuery = '';
  this.searchControl.setValue('', { emitEvent: false });
  this.onSearch.emit('');
}

ngOnInit() {
  this.searchControl.valueChanges.pipe(
    debounceTime(300),
    distinctUntilChanged()
  ).subscribe(value => {
    if(value){
      this.onSearch.emit(value)

    }
  });
}
}
