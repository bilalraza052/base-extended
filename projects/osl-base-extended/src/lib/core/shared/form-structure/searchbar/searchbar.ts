import { Component, EventEmitter, Input, Output } from '@angular/core';

 import { FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
@Component({
  selector: 'osl-searchbar',
  standalone:false,
  templateUrl: './searchbar.html',
  styleUrl: './searchbar.scss',
})
export class OslSearchbar {
  @Input('label') label:string="Type to Search..."
  @Output() onSearch = new EventEmitter<any>();

  searchQuery:string=""


searchControl = new FormControl('');
onKeyChange(){
  if(!this.searchQuery){
    this.onSearch.emit(this.searchQuery)
  }
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
