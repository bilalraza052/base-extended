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

  private nationalityList = [
    { name: 'Pakistani', code: 'PK' },
    { name: 'Filipino', code: 'PH' },
    { name: 'Indian', code: 'IN' },
    { name: 'Chinese', code: 'CN' },
    { name: 'Indonesian', code: 'ID' },
    { name: 'Myanmar', code: 'MM' },
    { name: 'Ukrainian', code: 'UA' },
    { name: 'Russian', code: 'RU' },
    { name: 'Bangladeshi', code: 'BD' },
    { name: 'Vietnamese', code: 'VN' },
    { name: 'Sri Lankan', code: 'LK' },
    { name: 'Egyptian', code: 'EG' },
    { name: 'Turkish', code: 'TR' },
    { name: 'Greek', code: 'GR' },
    { name: 'Croatian', code: 'HR' },
    { name: 'Polish', code: 'PL' },
    { name: 'Romanian', code: 'RO' },
    { name: 'Georgian', code: 'GE' },
    { name: 'Nigerian', code: 'NG' },
    { name: 'Ghanaian', code: 'GH' },
    { name: 'Malaysian', code: 'MY' },
    { name: 'Thai', code: 'TH' },
    { name: 'Korean', code: 'KR' },
    { name: 'Japanese', code: 'JP' },
    { name: 'German', code: 'DE' },
    { name: 'British', code: 'GB' },
    { name: 'Dutch', code: 'NL' },
    { name: 'Norwegian', code: 'NO' },
    { name: 'Danish', code: 'DK' },
    { name: 'Panamanian', code: 'PA' },
  ];

  // Backend-paginated search — mirrors the {page, pageSize, searchValue} -> {data, total} contract
  // the checkbox lister dialog expects, so pagination/search can be demoed end to end.
  searchNationalities(params: any) {
    const page = params?.page || 1;
    const pageSize = params?.pageSize || 25;
    const searchValue = params?.searchValue;
    let data = this.nationalityList;
    if (searchValue) {
      data = data.filter(x => x.name.toLowerCase().includes(String(searchValue).toLowerCase()));
    }
    return new Promise((resolve) => {
      setTimeout(() => {
        const start = (page - 1) * pageSize;
        resolve({ isSuccessful: true, result: { data: data.slice(start, start + pageSize), total: data.length } });
      }, 300);
    });
  }

  nationalityConfig() {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ isSuccessful: true, result: [
          { key: 'name', label: 'Nationality' },
          { key: 'code', label: 'Code' },
        ] });
      }, 150);
    });
  }
}
