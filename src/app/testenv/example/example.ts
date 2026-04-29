import { ChangeDetectorRef, Component, TemplateRef, ViewChild } from '@angular/core';
import { baseComponent } from '../../core/base/base.component';
import { FormStructureModule } from '../../core/shared/form-structure/form-structure.module';
import { OslGridColumn } from '../../core/shared/form-structure/grid/grid';
import { elements } from '../../core/shared/form-structure/dynamic-form/dynamic-form';
import { OslSetupSaveEvent } from '../../core/shared/form-structure/setup/setup';
import { OslFormGridColumn } from '../../core/shared/form-structure/form-grid/form-grid';
import { ExampleService } from '../service/example';
import { OslSkeletonModule } from '../../core/shared/directive/skeleton/skeleton.module';
import { SkeletonTheme } from '../../core/shared/directive/skeleton/skeleton.directive';
import { OslSkeletonThemeService } from '../../core/shared/directive/skeleton/skeleton-theme.service';

@Component({
  selector: 'app-example',
  imports: [FormStructureModule, OslSkeletonModule],
  templateUrl: './example.html',
  styleUrl: './example.scss',
})
export class Example extends baseComponent {
  loading = false;
    listData:any[]=[]
  colList:OslFormGridColumn[]=[]
  model:any={}
  @ViewChild('mainEngineConsumptionGrid',{static:true}) mainEngineConsumptionGrid:TemplateRef<any> | undefined

  leads: any[] = [
    {
      name: 'Bilal Raza',
      email: 'bilal@example.com',
      phone: '0300-1234567',
      status: 1,
      source: 'website',
    },
    {
      name: 'Usama Tariq',
      email: 'usama@example.com',
      phone: '0301-2345678',
      status: 2,
      source: 'referral',
    },
    {
      name: 'Sara Khan',
      email: 'sara@example.com',
      phone: '0302-3456789',
      status: 3,
      source: 'social',
    },
    {
      name: 'Ahmed Ali',
      email: 'ahmed@example.com',
      phone: '0303-4567890',
      status: 1,
      source: 'website',
    },
    {
      name: 'Fatima Noor',
      email: 'fatima@example.com',
      phone: '0304-5678901',
      status: 2,
      source: 'email',
    },
    {
      name: 'Zain Malik',
      email: 'zain@example.com',
      phone: '0305-6789012',
      status: 4,
      source: 'referral',
    },
    {
      name: 'Hina Butt',
      email: 'hina@example.com',
      phone: '0306-7890123',
      status: 1,
      source: 'social',
    },
    {
      name: 'Umar Farooq',
      email: 'umar@example.com',
      phone: '0307-8901234',
      status: 3,
      source: 'website',
    },
    {
      name: 'Maryam Shah',
      email: 'maryam@example.com',
      phone: '0308-9012345',
      status: 2,
      source: 'email',
    },
    {
      name: 'Kamran Akbar',
      email: 'kamran@example.com',
      phone: '0309-0123456',
      status: 1,
      source: 'referral',
    },
    {
      name: 'Nadia Hussain',
      email: 'nadia@example.com',
      phone: '0310-1234567',
      status: 4,
      source: 'social',
    },
    {
      name: 'Talha Qureshi',
      email: 'talha@example.com',
      phone: '0311-2345678',
      status: 2,
      source: 'website',
    },
  ];

  columns: OslGridColumn[] = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    {
      key: 'status',
      label: 'Status',
      enums: [
        { value: 1, label: 'New' },
        { value: 2, label: 'Contacted' },
        { value: 3, label: 'Qualified' },
        { value: 4, label: 'Closed' },
      ],
    },
    {
      key: 'source',
      label: 'Source',
      displayFn: (val) =>
        val ? (val as string).charAt(0).toUpperCase() + (val as string).slice(1) : '--',
    },
  ];

  sourceOptions = [
    { label: 'Website', value: 'website' },
    { label: 'Referral', value: 'referral' },
    { label: 'Social', value: 'social' },
    { label: 'Email', value: 'email' },
  ];

  statusOptions = [
    { label: 'New', value: 1 },
    { label: 'Contacted', value: 2 },
    { label: 'Qualified', value: 3 },
    { label: 'Closed', value: 4 },
  ];

  formElements: elements[] = [];

  // ── Form-Grid demo ────────────────────────────────────────────
  orderRows: any[] = [
    { product: 'Laptop', qty: 1, price: 85000, urgent: false },
    { product: 'Mouse', qty: 2, price: 1500, urgent: true },
    { product: 'Keyboard', qty: 1, price: 3500, urgent: false },
  ];

  productOptions = [
    { label: 'Laptop', value: 'Laptop' },
    { label: 'Mouse', value: 'Mouse' },
    { label: 'Keyboard', value: 'Keyboard' },
    { label: 'Monitor', value: 'Monitor' },
    { label: 'Headset', value: 'Headset' },
  ];

  orderColumns: OslFormGridColumn[] = [
    {
      key: 'product',
      displayName: 'Product',
      formElem: {
        elementType: 'select',
        key: 'product',
        label: 'Product',
        columns: 12,
        datasource: this.productOptions,
        displayField: 'label',
        valueField: 'value',
        required: true,
      },
    },
    {
      key: 'qty',
      displayName: 'Quantity',
      width: '140px',
      formElem: {
        elementType: 'textbox',
        key: 'qty',
        label: 'Qty',
        columns: 12,
        inputType: 'number',
        min: 1,
        required: true,
      },
    },
    {
      key: 'price',
      displayName: 'Unit Price (Rs)',
      width: '160px',
      formElem: {
        elementType: 'textbox',
        key: 'price',
        label: 'Price',
        columns: 12,
        inputType: 'number',
        min: 0,
        prefixIcon: 'attach_money',
      },
    },
    {
      key: 'urgent',
      displayName: 'Urgent',
      width: '100px',
      formElem: {
        elementType: 'slide-toggle',
        key: 'urgent',
        label: 'Urgent',
        columns: 12,
      },
    },
  ];
  beforeDisplay:((row: any) => any) | undefined;
  constructor(public cd: ChangeDetectorRef, public service:ExampleService,public skeletonService:OslSkeletonThemeService) {
    super();
  }
  ngOnInit(){
  
    this.beforeDisplay = (row)=>{
      row.testObj= {
        name:"Bilal",
        value:58
      }
      row.status = 58
      return row

    }
     this.formElements = [
      {
        columns: 12,
        elementType: 'fieldset',
        label: 'Basic Info',
        key: 'basicInfo',
        rows: [
          {
            columns: 3,
            elementType: 'select',
            label: 'Type',
            key: 'type',
            valueField: 'id',
            displayField: 'displayName',
  
            apiMethod: 'getCombo',
            // datasource: [
            //   {
            //     id: 1,
            //     displayName: 'Cellular',
            //   },
            //   {
            //     id: 2,
            //     displayName: 'Non-Cellular',
            //   },
            //   {
            //     id: 3,
            //     displayName: 'Multi Purpose',
            //   },
            // ],
          },
          {
            columns: 3,
            elementType: 'textbox',
            label: 'IMO',
            key: 'imoNo',
          },
          {
            columns: 3,
            elementType: 'textbox',
            label: 'Vessel Name',
            key: 'vesselName',
          },
          {
            columns: 3,
            elementType: 'textbox',
            label: 'Call Sign',
            key: 'callSign',
          },
          {
            columns: 3,
            elementType: 'textbox',
            label: 'Flag',
            key: 'flag',
          },
          {
            columns: 3,
            elementType: 'textbox',
            label: 'Port Of Registry',
            key: 'portOfRegistry',
          },
          {
            columns: 3,
            elementType: 'slide-toggle',
            label: 'Gear',
            key: 'gear',
          },
          {
            columns: 3,
            elementType: 'textbox',
            label: 'No Of Gears',
            key: 'noOfGears',
            inputType: 'number',
          },
          {
            columns: 3,
            elementType: 'textbox',
            label: 'SWL',
            key: 'swl',
          },
          {
            columns: 3,
            elementType: 'select',
            label: 'Class',
            key: 'class',
            valueField: 'id',
            displayField: 'displayName',
            datasource: [
              {
                id: 1,
                displayName: 'IBS',
              },
              {
                id: 2,
                displayName: 'RINA',
              },
              {
                id: 3,
                displayName: 'DNV',
              },
            ],
          },
          {
            columns: 3,
            elementType: 'textbox',
            label: 'Bow Thurster',
            key: 'bowThurster',
          },
          {
            columns: 3,
            elementType: 'textbox',
            label: 'Stern Thurster',
            key: 'sternThurster',
          },
          {
            columns: 3,
            elementType: 'textbox',
            label: 'Year of Built',
            key: 'yearofBuilt',
          },
        ],
      },
      {
        columns: 12,
        elementType: 'fieldset',
        label: 'Vessel Owner',
        key: 'vesselOwnFieldset',
        rows: [
          {
            columns: 4,
            label: "Vessel Owner's Name",
            elementType: 'textbox',
            key: 'vesselOwnerName',
          },
          {
            columns: 4,
            label: 'Country',
            elementType: 'autocomplete',
          
            apiMethod: 'loadAutocomplete',
            apiConfigMethod: 'config',
            searchType: 'Api',
            displayField: 'name',
            valueField: 'value',
            objectName: 'testObj',
            key: 'country',
          },
        ],
      },
      {
        columns: 12,
        elementType: 'fieldset',
        label: 'Vessel Specifications',
        key: 'vesselSpecsFieldset',
        rows: [
          {
            columns: 3,
            label: 'GRT Int',
            elementType: 'textbox',
            key: 'grtInt',
          },
          {
            columns: 3,
            label: 'NRT Int',
            elementType: 'textbox',
            key: 'nrtInt',
          },
          {
            columns: 3,
            label: 'Summer DWT',
            elementType: 'textbox',
            key: 'summerDWT',
          },
          {
            columns: 3,
            label: 'LOA (m)',
            elementType: 'textbox',
            key: 'loam',
          },
          {
            columns: 3,
            label: 'MTRS',
            elementType: 'textbox',
            key: 'mtrs',
          },
          {
            columns: 3,
            label: 'Beam (m)',
            elementType: 'textbox',
            key: 'beam',
          },
          {
            columns: 3,
            label: 'MTRS',
            elementType: 'textbox',
            key: 'beammtrs',
          },
          {
            columns: 3,
            label: 'Depth',
            elementType: 'textbox',
            key: 'depth',
          },
          {
            columns: 3,
            label: 'Suez Canal GT',
            elementType: 'textbox',
            key: 'suezCanalGT',
          },
          {
            columns: 3,
            label: 'Suez Canal NT',
            elementType: 'textbox',
            key: 'suezCanalNT',
          },
        ],
      },
      {
        columns: 12,
        elementType: 'fieldset',
        label: 'Cargo Capacity',
        key: 'cargoCapacityFieldset',
        rows: [
          {
            columns: 3,
            elementType: 'textbox',
            label: 'Nominal Cap',
            key: 'nominalCap',
          },

          {
            columns: 3,
            elementType: 'textbox',
            label: 'Effective Cap/14 mt TEU',
            key: 'effectiveCap14',
          },
          {
            columns: 3,
            elementType: 'textbox',
            label: 'Reefer Plugs',
            key: 'reeferplugs',
          },
          {
            columns: 3,
            elementType: 'textbox',
            label: 'Reefer Plugs In Hold',
            key: 'reeferplugsinHold',
          },

          {
            columns: 3,
            elementType: 'textbox',
            label: 'Reefer Plugs On Deck',
            key: 'reeferplugsinDeck',
          },
          {
            columns: 3,
            elementType: 'textbox',
            label: 'No. of Hold',
            key: 'noOfHold',
          },
          {
            columns: 3,
            elementType: 'textbox',
            label: 'No of Hatches',
            key: 'noOfHatches',
          },
          {
            columns: 3,
            elementType: 'radio',
            label: 'Russian Stowed',
            key: 'russianStowed',
            valueField: 'value',
            displayField: 'display',
            datasource: [
              {
                display: 'Allowed',
                value: 1,
              },
              {
                display: 'Not Allowed',
                value: 2,
              },
            ],
          },
          {
            columns: 4,
            elementType: 'textbox',
            label: 'Under Deck of HC Intake W/O LS',
            key: 'underDeckOfHCIntake',
          },
        ],
      },
      {
        columns: 12,
        elementType: 'fieldset',
        label: 'Deck Strength',
        key: 'vesselOwnFieldset',
        rows: [
          {
            columns: 6,
            elementType: 'fieldset',
            label: 'Stack Wgt in cargo hold',
            key: 'stackWgtInCargoHold',
            rows: [
              {
                columns: 6,
                label: '20FT',
                elementType: 'textbox',
                key: '20ftStackInCargoHold',
              },
              {
                columns: 6,
                label: '40FT',
                elementType: 'textbox',
                key: '40ftStackInCargoHold',
              },
            ],
          },
          {
            columns: 6,
            elementType: 'fieldset',
            label: 'Stack Wgt on deck',
            key: 'stackWgtonDeck',
            rows: [
              {
                columns: 6,
                label: '20FT',
                elementType: 'textbox',
                key: '20ftStackonDeck',
              },
              {
                columns: 6,
                label: '40FT',
                elementType: 'textbox',
                key: '40ftStackonDeck',
              },
            ],
          },
        ],
      },
      {
        columns: 12,
        elementType: 'fieldset',
        label: 'Fuel Specifications / Tank Capacity',
        key: 'fuelSpecifications',
        rows: [
          {
            columns: 3,
            label: 'LSFO',
            elementType: 'textbox',
            key: 'lsfo',
          },
          {
            columns: 3,
            label: 'MGO',
            elementType: 'textbox',
            key: 'mgo',
          },

          {
            columns: 3,
            label: 'VLSFO',
            elementType: 'textbox',
            key: 'vlsfo',
          },
          {
            columns: 3,
            label: 'Fresh water (cbm)',
            elementType: 'textbox',
            key: 'freshWaterCBM',
          },
          {
            columns: 3,
            label: 'Ballast (cbm)',
            elementType: 'textbox',
            key: 'ballastCBM',
          },
          {
            columns: 3,
            label: 'Other Tanks',
            elementType: 'textbox',
            key: 'otherTanks',
          },
      
        ],
      },
       {
        columns: 12,
        elementType: 'fieldset',
        label: 'Vessel Particular',
        key: 'fuelSpecifications',
        rows: [
          {
             columns:6,
             elementType:'templateRef',
             label:"",
             key:"",
             templateRef:this.mainEngineConsumptionGrid
          }
        ]
       },
    ];
      
     this.colList = [
      {
       key:'speed',
       displayName:'Speed',
       label:'Speed',
       formElem:{
        columns:12,
        elementType:'textbox',
        key:'speed',
        label:'Speed'
       }
      },
      {
       key:'consumptionMT',
       displayName:'Consumption MT',
       label:'Consumption MT',
       formElem:{
        columns:12,
        elementType:'textbox',
        key:'consumptionMT',
        label:''
       }
      },
         {
       key:'rpm',
       displayName:'RPM',
       label:'RPM',
       formElem:{
        columns:12,
        elementType:'checkbox',
        key:'rpm',
        label:''
       }
      },

    ]
  
  }
  ngAfterViewInit(){
    
  
    
  }
  onSearch(query: string) {
    this.showSuccess('Searching: ' + query);
  }

  onSave(event: OslSetupSaveEvent) {
    if (event.mode === 'add') {
      this.leads = [...this.leads, event.model];
      this.showSuccess('Lead added successfully.');
    } else {
      this.leads = this.leads.map((l) =>
        l.email === event.model.email ? { ...l, ...event.model } : l,
      );
      this.showSuccess('Lead updated successfully.');
    }
  }

  onDelete(row: any) {
    this.leads = this.leads.filter((l) => l !== row);
    this.showSuccess('"' + row.name + '" deleted.');
  }

  simulateLoading() {
    this.loading = true;
    setTimeout(() => {
      this.loading = false;
      this.cd.markForCheck();
    }, 2500);
  }
}
