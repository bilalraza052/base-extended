import { Injectable } from '@angular/core';
import { Httpbase } from '../../core/http/httpbase';

@Injectable({
  providedIn: 'root',
})
export class ExampleService extends Httpbase {
  constructor(){
    super('testingController')
  }
  loadAutocomplete(value:any){

    let arr = [
        {
          name:"Hello",
          value:'helloworld'
        },
        {
          name:"Hello1",
          value:'helloworld1' 
        },  {
          name:"Hello3",
          value:'helloworld2' 
        },
         {
          name:"Hello4",
          value:'helloworld3' 
        },{
          name:"Hello6",
          value:'helloworld6' 
        },
        {
          name:"Hello10",
          value:'helloworld10' 
        },
        
      ]
        
     return new Promise((resolve) => {
    setTimeout(() => {
      resolve({isSuccessful:true,result:arr.filter(x=>x.name?.toLowerCase()?.includes((typeof value == 'string' ? value : value?.searchValue)?.toLowerCase()))})
    }, 250);
  });
      
  }
  config(){
    return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        isSuccessful:true,
        result:[
        {
          key:'name',
          label:'Status'

        }
      ]})
    }, 250);
  });

  }
  async getCombo(){
    return await this.get("hello")
  }
}
