import { ChangeDetectorRef, Component, TemplateRef, ViewChild } from '@angular/core';
import { baseComponent } from '../../core/base/base.component';
import { FormStructureModule } from '../../core/shared/form-structure/form-structure.module';
import { OslGridColumn, OslMenuAction } from '../../core/shared/form-structure/grid/grid';
import { elements } from '../../core/shared/form-structure/dynamic-form/dynamic-form';
import { OslSetupSaveEvent } from '../../core/shared/form-structure/setup/setup';
import { OslFormGridColumn } from '../../core/shared/form-structure/form-grid/form-grid';
import { OslReportColumn } from '../../core/shared/form-structure/report-grid/report-grid';
import { ReportGenerateType } from '../../core/shared/form-structure/report-form/report-form';
import { ExampleService } from '../service/example';
import { UserLogMeta } from '../../core/shared/form-structure/user-log/user-log';
import { OslSkeletonModule } from '../../core/shared/directive/skeleton/skeleton.module';
import { SkeletonTheme } from '../../core/shared/directive/skeleton/skeleton.directive';
import { OslSkeletonThemeService } from '../../core/shared/directive/skeleton/skeleton-theme.service';
import { raceWith } from 'rxjs';
import { OslDocumentUploader, OslSavedDocument } from '../../core/shared/form-structure/document-uploader/document-uploader';
import { OslTooltipDirective } from '../../core/shared/directive/tooltip/tooltip.directive';

@Component({
  selector: 'app-example',
  imports: [FormStructureModule, OslSkeletonModule, OslTooltipDirective],
  templateUrl: './example.html',
  styleUrl: './example.scss',
})
export class Example extends baseComponent {
  loading = false;

  logMeta: UserLogMeta = {
    addLog: 'Bilal Raza',
    addOn: '2026-05-28T09:15:00',
    editLog: 'Sara Khan',
    editOn: new Date(),
  };

  logMetaAddOnly: UserLogMeta = {
    addLog: 'Ahmed Ali',
    addOn: '2026-06-01T11:30:00',
  };
    listData:any[]=[]
  colList:OslFormGridColumn[]=[]
  model:any={}
  moreMenu:OslMenuAction[]=[
    {
      label:'Approve',
      click(row) {
        console.log(raceWith)
        
      },
    }
  ]
  @ViewChild('mainEngineConsumptionGrid',{static:true}) mainEngineConsumptionGrid:TemplateRef<any> | undefined
  @ViewChild('docUploader') docUploader!: OslDocumentUploader;

  // ── Document Uploader Demo ────────────────────────────────────────────────
  docUploaderModel: any = {};
  docPendingFiles: File[] = [];

  savedDocs: OslSavedDocument[] = [
    { id: 1, name: 'Vessel_Certificate.pdf', file: '/docs/1',  addBy: 'Bilal Raza',  addOn: '2026-01-15' },
    { id: 2, name: 'Bill_of_Lading.docx',    file: '/docs/2',  addBy: 'Sara Khan',   addOn: '2026-02-20' },
    { id: 3, name: 'Cargo_Manifest.xlsx',    file: '/docs/3',  addBy: 'Ahmed Ali',   addOn: '2026-03-05' },
    { id: 4, name: 'Port_Survey_Photo.jpg',  file: '/docs/4',  addBy: 'Bilal Raza',  addOn: new Date('2026-05-10') },
  ];

  onDocUpload(formData: FormData) {
    console.log('FormData ready for API:', formData);
    for (const [key, val] of (formData as any).entries()) {
      console.log(` ${key}:`, val);
    }
    alert(`Uploading ${this.docPendingFiles.length} file(s). Check console for FormData entries.`);
  }

  onDocView(doc: OslSavedDocument) {
    console.log('View:', doc);
    alert(`Viewing: ${doc.name}`);
  }

  onDocDownload(doc: OslSavedDocument) {
    console.log('Download:', doc);
    alert(`Downloading: ${doc.name}`);
  }

  onDocDelete(doc: OslSavedDocument) {
    this.savedDocs = this.savedDocs.filter(d => d.id !== doc.id);
  }

  onDocFilesChanged(files: File[]) {
    this.docPendingFiles = files;
  }

  uploadViaRef() {
    this.docUploader.upload();
  }
  // ─────────────────────────────────────────────────────────────────────────

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
        decimalPortion:4,
        // min: 1,
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
  beforeSave:((row: any) => any) | undefined;
  loader: boolean =false;
  constructor(public cd: ChangeDetectorRef, public service:ExampleService,public skeletonService:OslSkeletonThemeService) {
    super();
  }
  
  async getAllVessel(page = 1, pageSize = 10, searchValue:any) {
    // this.cd.markForCheck()

    // this.cd.detectChanges()

    this.loader= true
    // const res = await this.service.getAllVessels({
    //   page: page,
    //   pageSize: pageSize,
    //   searchValue: searchValue,
    // });
    // if (!res.isSuccessful) return this.showError(res.error);
    setTimeout(()=>{
      this.loader= false
      this.listData = [
        {
          vesselTypeId:1
        }
      ]
//  this.cd.detectChanges()
//     this.cd.markForCheck()
    },200)
   
  
    // this.listData = res.result?.data || [];
  }
  // onSave = async (event: any): Promise<boolean> => {
  //   console.log('save', event);
  //   return true;
  // };

  onEdit(row: any) {
    console.log('edit', row);
  }

  onDeleteLead(row: any) {
    this.leads = this.leads.filter(l => l !== row);
  }

  onSearchLeads(value: string) {
    console.log('search', value);
  }

  onSearch(){

  }
  async onPageChange(event:any) {
    console.log(event)
    await this.getAllVessel(event.page, event.pageSize, event.searchValue);
     this.cd.detectChanges()
    this.cd.markForCheck()
  }

  // ── Report Grid Demo ──────────────────────────────────────────────────────

  reportSelectedRows: any[] = [];
  reportLoading = false;

  reportColumns: OslReportColumn[] = [
    {
      key: 'orderId',
      label: 'Order ID',
      width: 100,
      pinned: true,
      sortable: true,
      filterable: false,
      groupable: false,
      displayFn: (v) => `#${String(v).padStart(5, '0')}`,
    },
    {
      key: 'customer',
      label: 'Customer',
      width: 180,
      pinned: true,
      sortable: true,
      filterable: true,
      groupable: true,
    },
    {
      key: 'region',
      label: 'Region',
      width: 130,
      sortable: true,
      filterable: true,
      groupable: true,
    },
    {
      key: 'category',
      label: 'Category',
      width: 140,
      sortable: true,
      filterable: true,
      groupable: true,
      enums: [
        { value: 'electronics', label: 'Electronics' },
        { value: 'clothing', label: 'Clothing' },
        { value: 'furniture', label: 'Furniture' },
        { value: 'food', label: 'Food & Beverage' },
        { value: 'sports', label: 'Sports' },
      ],
    },
    {
      key: 'product',
      label: 'Product',
      width: 200,
      sortable: true,
      filterable: true,
      groupable: false,
    },
    {
      key: 'quantity',
      label: 'Qty',
      width: 80,
      align: 'right',
      sortable: true,
      filterable: false,
      groupable: false,
      displayType: 'number',
     
    },
    {
      key: 'unitPrice',
      label: 'Unit Price',
      width: 120,
      align: 'right',
      sortable: true,
      filterable: false,
      groupable: false,
      displayType: 'currency',
      aggregate: 'avg',
    },
    {
      key: 'totalAmount',
      label: 'Total Amount',
      width: 140,
      align: 'right',
      sortable: true,
      filterable: false,
      groupable: false,
      displayType: 'currency',
      aggregate: 'sum',
    },
    {
      key: 'discount',
      label: 'Discount',
      width: 100,
      align: 'right',
      sortable: true,
      filterable: false,
      groupable: false,
      displayType: 'percentage',
      aggregate: 'avg',
    },
    {
      key: 'profit',
      label: 'Profit',
      width: 120,
      align: 'right',
      sortable: true,
      filterable: false,
      groupable: false,
      displayType: 'currency',
      aggregate: 'sum',
      cellClass: (value: number) =>
        value >= 0 ? 'rg-profit-pos' : 'rg-profit-neg',
    },
    {
      key: 'status',
      label: 'Status',
      width: 120,
      sortable: true,
      filterable: true,
      groupable: true,
      enums: [
        { value: 'delivered', label: 'Delivered' },
        { value: 'shipped', label: 'Shipped' },
        { value: 'processing', label: 'Processing' },
        { value: 'pending', label: 'Pending' },
        { value: 'cancelled', label: 'Cancelled' },
      ],
      cellClass: (_: any, row: any) => {
        const map: Record<string, string> = {
          delivered: 'rg-status-delivered',
          shipped: 'rg-status-shipped',
          processing: 'rg-status-processing',
          pending: 'rg-status-pending',
          cancelled: 'rg-status-cancelled',
        };
        return map[row.status] ?? '';
      },
    },
    {
      key: 'paymentMethod',
      label: 'Payment',
      width: 130,
      sortable: true,
      filterable: true,
      groupable: true,
      enums: [
        { value: 'card', label: 'Credit Card' },
        { value: 'bank', label: 'Bank Transfer' },
        { value: 'cash', label: 'Cash' },
        { value: 'wallet', label: 'E-Wallet' },
      ],
    },
    {
      key: 'orderDate',
      label: 'Order Date',
      width: 120,
      sortable: true,
      filterable: true,
      groupable: false,
      displayType: 'date',
    },
    {
      key: 'deliveryDate',
      label: 'Delivery Date',
      width: 130,
      sortable: true,
      filterable: true,
      groupable: false,
      displayType: 'date',
    },
    {
      key: 'rating',
      label: 'Rating',
      width: 100,
      align: 'center',
      sortable: true,
      filterable: true,
      groupable: false,
      displayFn: (v: number) => v ? '★'.repeat(v) + '☆'.repeat(5 - v) : '--',
      aggregate: 'avg',
    },
    {
      key: 'salesRep',
      label: 'Sales Rep',
      width: 150,
      sortable: true,
      filterable: true,
      groupable: true,
    },
  ];

  reportData: any[] = this.generateReportData(1000);

  private generateReportData(count: number): any[] {
    const customers = [
      'Alpha Corp', 'Beta Industries', 'Gamma LLC', 'Delta Enterprises',
      'Epsilon Holdings', 'Zeta Solutions', 'Eta Dynamics', 'Theta Global',
      'Iota Systems', 'Kappa Group', 'Lambda Tech', 'Mu Logistics',
    ];
    const regions = ['North', 'South', 'East', 'West', 'Central'];
    const categories = ['electronics', 'clothing', 'furniture', 'food', 'sports'];
    const products: Record<string, string[]> = {
      electronics: ['Laptop Pro X1', 'Wireless Earbuds', '4K Monitor', 'Smart Watch', 'Tablet Air'],
      clothing: ['Winter Jacket', 'Denim Jeans', 'Running Shoes', 'Polo Shirt', 'Casual Dress'],
      furniture: ['Office Chair', 'Standing Desk', 'Bookshelf', 'Sofa Set', 'Dining Table'],
      food: ['Premium Coffee', 'Protein Bars', 'Organic Juice', 'Snack Box', 'Tea Collection'],
      sports: ['Gym Bag', 'Yoga Mat', 'Resistance Bands', 'Water Bottle', 'Jump Rope'],
    };
    const statuses = ['delivered', 'shipped', 'processing', 'pending', 'cancelled'];
    const payments = ['card', 'bank', 'cash', 'wallet'];
    const salesReps = ['Ali Hassan', 'Sara Khan', 'Umar Sheikh', 'Maryam Noor', 'Bilal Raza', 'Fatima Syed'];
    const statusWeights = [40, 25, 20, 10, 5];

    const weightedStatus = () => {
      const r = Math.random() * 100;
      let acc = 0;
      for (let i = 0; i < statuses.length; i++) {
        acc += statusWeights[i];
        if (r < acc) return statuses[i];
      }
      return statuses[0];
    };

    const rnd = (min: number, max: number) => Math.random() * (max - min) + min;
    const rndInt = (min: number, max: number) => Math.floor(rnd(min, max + 1));
    const pick = <T>(arr: T[]) => arr[rndInt(0, arr.length - 1)];

    const baseDate = new Date('2024-01-01');
    const addDays = (d: Date, days: number) => {
      const nd = new Date(d);
      nd.setDate(nd.getDate() + days);
      return nd;
    };

    return Array.from({ length: count }, (_, i) => {
      const category = pick(categories);
      const product = pick(products[category]);
      const qty = rndInt(1, 50);
      const unitPrice = parseFloat(rnd(10, 2000).toFixed(2));
      const totalAmount = parseFloat((qty * unitPrice).toFixed(2));
      const discount = parseFloat(rnd(0, 25).toFixed(2));
      const profit = parseFloat((totalAmount * (1 - discount / 100) - totalAmount * 0.6).toFixed(2));
      const orderDate = addDays(baseDate, rndInt(0, 365));
      const deliveryDate = addDays(orderDate, rndInt(1, 14));
      return {
        orderId: 10000 + i + 1,
        customer: pick(customers),
        region: pick(regions),
        category,
        product,
        quantity: qty,
        unitPrice,
        totalAmount,
        discount,
        profit,
        status: weightedStatus(),
        paymentMethod: pick(payments),
        orderDate: orderDate.toISOString(),
        deliveryDate: deliveryDate.toISOString(),
        rating: rndInt(1, 5),
        salesRep: pick(salesReps),
      };
    });
  }

  get selectedTotalAmount(): number {
    return this.reportSelectedRows.reduce((sum, r) => sum + (r.totalAmount ?? 0), 0);
  }

  onReportRowClick(row: any): void {
    console.log('Report row clicked:', row);
  }

  onReportSelection(rows: any[]): void {
    this.reportSelectedRows = rows;
    console.log(`${rows.length} rows selected`);
  }

  // ── Account Ledger Report ─────────────────────────────────────────────────────

  ledgerModel: any = {
    dateFrom: '2025-01-01',
    dateTo: '2025-12-31',
  };

  ledgerFormElements: elements[] = [
    {
      columns: 4,
      elementType: 'select',
      label: 'Account',
      key: 'accountId',
      required: true,
      displayField: 'label',
      valueField: 'value',
      selectPlaceholder: 'Select account...',
      datasource: [
        { label: 'Cash in Hand', value: 1 },
        { label: 'Bank - HBL Main Account', value: 2 },
        { label: 'Bank - MCB Current Account', value: 3 },
        { label: 'Accounts Receivable', value: 4 },
        { label: 'Accounts Payable', value: 5 },
        { label: 'Sales Revenue', value: 6 },
        { label: 'Purchase Account', value: 7 },
        { label: 'General Expenses', value: 8 },
      ],
    },
    {
      columns: 3,
      elementType: 'datepicker',
      label: 'Date From',
      key: 'dateFrom',
      required: true,
    },
    {
      columns: 3,
      elementType: 'datepicker',
      label: 'Date To',
      key: 'dateTo',
      required: true,
    },
    {
      columns: 2,
      elementType: 'slide-toggle',
      label: 'Include Narration',
      key: 'includeNarration',
      labelPosition: 'after',
    },
  ];

  ledgerColumns: OslReportColumn[] = [
    {
      key: 'date',
      label: 'Date',
      width: 110,
      displayType: 'date',
      sortable: true,
      filterable: true,
      groupable: false,
      pinned: false,
    },
    {
      key: 'voucherNo',
      label: 'Voucher No',
      width: 140,
      sortable: true,
      filterable: true,
      groupable: false,
      pinned: true,
      displayFn: (v) => String(v),
    },
    {
      key: 'voucherType',
      label: 'Type',
      width: 100,
      sortable: true,
      filterable: true,
      groupable: true,
      enums: [
        { value: 'PV', label: 'Payment Voucher' },
        { value: 'RV', label: 'Receipt Voucher' },
        { value: 'JV', label: 'Journal Voucher' },
        { value: 'BT', label: 'Bank Transfer' },
        { value: 'SJ', label: 'Sales Journal' },
        { value: 'PJ', label: 'Purchase Journal' },
      ],
    },
    {
      key: 'description',
      label: 'Description / Narration',
      width: 280,
      sortable: false,
      filterable: false,
      groupable: false,
    },
    {
      key: 'reference',
      label: 'Reference',
      width: 140,
      sortable: true,
      filterable: true,
      groupable: false,
    },
    {
      key: 'party',
      label: 'Party / Payee',
      width: 180,
      sortable: true,
      filterable: true,
      groupable: true,
    },
    {
      key: 'debit',
      label: 'Debit',
      width: 140,
      align: 'right',
      sortable: true,
      filterable: false,
      groupable: false,
      displayType: 'currency',
      headerGroup:'Opening',
      aggregate: 'sum',
    },
    {
      key: 'credit',
      label: 'Credit',
      width: 140,
      align: 'right',
      sortable: true,
      filterable: false,
      groupable: false,
      displayType: 'currency',
      headerGroup:'Opening',

      aggregate: 'sum',
    },
    {
      key: 'balance',
      label: 'Running Balance',
      width: 155,
      align: 'right',
      sortable: false,
      filterable: true,
      groupable: false,
      displayType: 'currency',
      headerGroup:'Opening',

      cellClass: (_: any, row: any) => row.balance >= 0 ? 'rg-profit-pos' : 'rg-profit-neg',
    },
  ];

  onLedgerGenerate = async (_model: any, _type: ReportGenerateType): Promise<any[]> => {
    await new Promise(r => setTimeout(r, 900));
    return this._generateLedgerData();
  };

  private _generateLedgerData(): any[] {
    const parties = [
      'Alpha Trading Co.', 'Beta Suppliers Ltd.', 'Gamma Enterprises',
      'Delta Distribution', 'Epsilon Corp', 'Karachi Traders',
      'Lahore Merchants', 'Islamabad Services', 'Multan Holdings', 'Faisalabad Mills',
    ];
    const vouchers: Array<{ type: string; prefix: string; descs: string[] }> = [
      {
        type: 'RV', prefix: 'RV',
        descs: [
          'Cash received against invoice', 'Advance received from customer',
          'Receipt against outstanding balance', 'Earnest money received',
        ],
      },
      {
        type: 'PV', prefix: 'PV',
        descs: [
          'Payment to supplier against PO', 'Utility bill payment',
          'Salary disbursement', 'Office rent payment', 'Transport charges paid',
        ],
      },
      {
        type: 'JV', prefix: 'JV',
        descs: [
          'Depreciation adjustment', 'Accrued expense entry',
          'Provision for doubtful debts', 'Opening balance entry', 'Contra entry',
        ],
      },
      {
        type: 'BT', prefix: 'BT',
        descs: [
          'Inter-bank transfer', 'Fund transfer to branch',
          'Online transfer via IBFT', 'RTGS transfer',
        ],
      },
      {
        type: 'SJ', prefix: 'SJ',
        descs: [
          'Sales invoice posted', 'Revenue recognized', 'Credit sale entry',
        ],
      },
      {
        type: 'PJ', prefix: 'PJ',
        descs: [
          'Purchase bill posted', 'Import clearance charges',
          'Stock purchase entry', 'Raw material received',
        ],
      },
    ];

    const pick = <T>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];
    const rnd = (min: number, max: number) => parseFloat((Math.random() * (max - min) + min).toFixed(2));

    const rows: any[] = [];
    let balance = 125000;
    let voucherSeq = 1001;

    for (let m = 0; m < 12; m++) {
      const txPerMonth = Math.floor(Math.random() * 6) + 4;
      for (let t = 0; t < txPerMonth; t++) {
        const day = Math.floor(Math.random() * 28) + 1;
        const date = new Date(2025, m, day).toISOString();
        const vGroup = pick(vouchers);
        const isDebit = ['PV', 'PJ', 'BT'].includes(vGroup.type) ? Math.random() > 0.2 : Math.random() < 0.25;
        const amount = rnd(5000, 250000);
        const debit = isDebit ? amount : 0;
        const credit = isDebit ? 0 : amount;
        balance += credit - debit;

        rows.push({
          date,
          voucherNo: `${vGroup.prefix}-${voucherSeq++}`,
          voucherType: vGroup.type,
          description: pick(vGroup.descs),
          reference: `REF-${Math.floor(Math.random() * 90000) + 10000}`,
          party: pick(parties),
          debit,
          credit,
          balance: parseFloat(balance.toFixed(2)),
        });
      }
    }

    console.log('download')

    return rows.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  // ─────────────────────────────────────────────────────────────────────────────

  ngAfterViewInit() {
  }
  ngOnInit(){
   
      this.cd.detectChanges()
      this.cd.markForCheck()
    setTimeout(()=>{
      this.model.testObj= {
        name:"Bilal",
        value:"KR"
      }
      this.model.country = "KR"
    
      
    },2000)

  
    this.beforeDisplay = async (row)=>{
      const result:any = await  new Promise((resolve) => {
    setTimeout(() => {
      resolve({isSuccessful:true,result:{portOfRegistry:4}})
    }, 250);
  })
     
      return result?.result

    }
    this.beforeSave = (model)=>{
      console.log(model)
    
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
            apiService:this.service,
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
            columns: 12,
            elementType: 'datepicker',
            label: 'IMO',
            key: 'imoNo',
            // maxDate:'5-4-2026'
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
            inputType:'number',
            decimalPortion:4
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
            apiService:this.service,
            apiMethod: 'loadAutocomplete',
            apiConfigMethod: 'config',
            searchType: 'Api',
            // isListerAutocomplete:false,
           
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
      {
        columns: 12,
        elementType: 'fieldset',
        label: 'Multi-Select / Chips / Multi-Autocomplete Demo',
        key: 'newFeaturesFieldset',
        rows: [
          {
            columns: 4,
            elementType: 'select',
            label: 'Ports (Multi-Select with Select All)',
            key: 'ports',
            selectMultiple: true,
            showSelectAll: true,
            clearable: true,
            displayField: 'label',
            valueField: 'value',
            datasource: [
              { label: 'Karachi', value: 'KHI' },
              { label: 'Port Qasim', value: 'PQA' },
              { label: 'Gwadar', value: 'GWD' },
              { label: 'Dubai', value: 'DXB' },
              { label: 'Singapore', value: 'SGP' },
            ],
          },
          {
            columns: 4,
            elementType: 'select',
            label: 'Flags (Multi-Select, no Select All)',
            key: 'flags',
            selectMultiple: true,
            showSelectAll: false,
            clearable: true,
            displayField: 'label',
            valueField: 'value',
            datasource: [
              { label: 'Pakistan', value: 'PK' },
              { label: 'Panama', value: 'PA' },
              { label: 'Marshall Islands', value: 'MH' },
              { label: 'Liberia', value: 'LR' },
              { label: 'Bahamas', value: 'BS' },
            ],
          },
          {
            columns: 4,
            elementType: 'chips-input',
            label: 'Certificate Numbers (Chips Input)',
            key: 'certificateNumbers',
            placeholder: 'Type a number and press Enter...',
            required: true,
          },
          {
            columns: 6,
            elementType: 'autocomplete',
            label: 'Crew Nationalities (Multi Autocomplete)',
            key: 'crewNationalities',
            autocompleteMultiple: true,
            displayField: 'name',
            valueField: 'code',
            searchType: 'Local',
            datasource: [
              { name: 'Pakistani', code: 'PK' },
              { name: 'Filipino', code: 'PH' },
              { name: 'Indian', code: 'IN' },
              { name: 'Chinese', code: 'CN' },
              { name: 'Indonesian', code: 'ID' },
              { name: 'Myanmar', code: 'MM' },
              { name: 'Ukrainian', code: 'UA' },
              { name: 'Russian', code: 'RU' },
            ],
          },
          {
            columns: 6,
            elementType: 'chips-input',
            label: 'Trading Routes (Chips Input)',
            key: 'tradingRoutes',
            placeholder: 'Add a route and press Enter...',
          },
        ],
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

}
