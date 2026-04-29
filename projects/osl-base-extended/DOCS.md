# osl-base-extended — Developer Documentation

**Version:** 0.1.12  
**Author:** Bilal Raza  
**Angular:** 21.2.0+  
**License:** ISC

---

## Table of Contents

1. [Overview](#1-overview)
2. [Installation & Setup](#2-installation--setup)
3. [Architecture](#3-architecture)
4. [API Layer — Httpbase](#4-api-layer--httpbase)
5. [Base UI Service — baseComponent](#5-base-ui-service--basecomponent)
6. [CRUD UI — osl-setup](#6-crud-ui--osl-setup)
7. [Dynamic Forms — DynamicForm](#7-dynamic-forms--dynamicform)
8. [Data Grid — OslGrid](#8-data-grid--oslgrid)
9. [Inline Form Grid — OslFormGrid](#9-inline-form-grid--oslformgrid)
10. [Form Components Reference](#10-form-components-reference)
11. [Skeleton Loading — OslSkeletonDirective](#11-skeleton-loading--oslskeletivedirective)
12. [Datasource Cache Service](#12-datasource-cache-service)
13. [Utility Namespaces](#13-utility-namespaces)
14. [Full TypeScript Interface Reference](#14-full-typescript-interface-reference)
15. [Advanced Patterns](#15-advanced-patterns)
16. [Troubleshooting](#16-troubleshooting)

---

## 1. Overview

`osl-base-extended` is an **enterprise Angular library** that eliminates repetitive boilerplate when building data-driven applications. It provides:

- A fully-typed **HTTP abstraction layer** with authentication, CRUD shorthands, and error normalization
- A **zero-config CRUD page component** (`<osl-setup>`) that combines grid, dialog, forms, pagination, and delete confirmation in one tag
- A **declarative form engine** that generates any form from a JSON configuration array
- A **GPU-accelerated skeleton loading directive** with 8 preset layouts and 4 animation modes
- **200+ pure utility functions** across 7 namespaces — array, date, number, object, string, storage, and validation

The library targets teams that need to ship enterprise screens fast without sacrificing type safety or flexibility.

---

## 2. Installation & Setup

### Install the package

```bash
npm install osl-base-extended
```

### Install peer dependencies

```bash
npm install @angular/material @angular/cdk
```

### Configure the HTTP client

```typescript
// app.config.ts
import { ApplicationConfig } from '@angular/core';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(withInterceptorsFromDi()),
  ],
};
```

### Import library modules

```typescript
// app.module.ts
import { FormStructureModule, OslSkeletonModule } from 'osl-base-extended';

@NgModule({
  imports: [
    FormStructureModule,   // includes all form components + osl-setup + osl-grid
    OslSkeletonModule,     // includes [oslSkeleton] directive
  ],
})
export class AppModule {}
```

### Set the authentication token

The library reads the JWT from `localStorage` automatically on every request:

```typescript
// After login
localStorage.setItem('token', response.token);

// On logout
localStorage.removeItem('token');
```

---

## 3. Architecture

```
osl-base-extended
│
├── core/
│   ├── base/           baseComponent          ← UI helpers (snackbar, dialog)
│   └── http/           Httpbase               ← HTTP abstraction layer
│
├── shared/
│   ├── components/
│   │   ├── dialog-wrapper/    DialogWrapper   ← Material dialog container
│   │   └── delete-confirmation/ DeleteConfirmation
│   │
│   ├── directives/
│   │   └── skeleton/   OslSkeletonDirective   ← Skeleton loading
│   │                   OslSkeletonThemeService
│   │
│   └── form-structure/
│       ├── setup/          OslSetup           ← Full CRUD page
│       ├── grid/           OslGrid            ← Data table
│       ├── form-grid/      OslFormGrid        ← Inline editable grid
│       ├── dynamic-form/   DynamicForm        ← Declarative form engine
│       ├── datasource-cache/ DatasourceCacheService
│       ├── input/          Oslinput
│       ├── textarea/       Osltextarea
│       ├── select/         OslSelect
│       ├── autocomplete/   OslAutocomplete
│       ├── autocomplete-lister/ OslAutocompleteLister
│       ├── radio/          OslRadio
│       ├── checkbox/       OslCheckbox
│       ├── slide-toggle/   OslSlideToggle
│       ├── datepicker/     OslDatepicker
│       ├── file-upload/    OslFileUpload
│       ├── button/         OslButton
│       └── searchbar/      OslSearchbar
│
└── util/
    ├── ArrayUtil
    ├── DateUtil
    ├── NumberUtil
    ├── ObjectUtil
    ├── StringUtil
    ├── StorageUtil
    └── ValidationUtil
```

---

## 4. API Layer — Httpbase

### Concept

`Httpbase` is an **abstract class**. Create one concrete service per backend controller by extending it and passing the controller name to `super()`. You immediately inherit all HTTP verb wrappers, CRUD shorthands, auth injection, and error normalization.

```
/api/{controllerName}/{methodName}?{params}
```

The base URL is `/api/` — configure a proxy in `angular.json` or `proxy.conf.json` to forward requests to your backend.

### Creating a service

```typescript
import { Injectable } from '@angular/core';
import { Httpbase } from 'osl-base-extended';

@Injectable({ providedIn: 'root' })
export class ProductService extends Httpbase {
  constructor() {
    super('Product'); // all requests go to /api/Product/...
  }
}
```

### Built-in public CRUD methods

These are ready to call from any component without any additional code in the service.

#### `getAll<T>()`

```typescript
// GET /api/Product/GetAll
const res = await this.productSvc.getAll<Product[]>();
if (res.isSuccessful) {
  this.products = res.result;
}
```

#### `getById<T>(id)`

```typescript
// GET /api/Product/GetById?id=42
const res = await this.productSvc.getById<Product>(42);
```

#### `save<T>(body)`

```typescript
// POST /api/Product/Save   {body as JSON}
const res = await this.productSvc.save<Product>({ name: 'Widget', price: 9.99 });
if (res.isSuccessful) {
  this.base.showSuccess('Product created!');
}
```

#### `update<T>(body)`

```typescript
// PUT /api/Product/Update   {body as JSON}
const res = await this.productSvc.update<Product>({ id: 42, name: 'Widget Pro' });
```

#### `remove<T>(id)`

```typescript
// DELETE /api/Product/Delete?id=42
const res = await this.productSvc.remove(42);
```

#### `search(body)`

```typescript
// POST /api/Product/Search   {body as JSON}
const res = await this.productSvc.search({ category: 'Electronics', page: 1, pageSize: 25 });
```

#### `getConfig()`

```typescript
// GET /api/Product/getConfig
const res = await this.productSvc.getConfig();
// Used internally by OslAutocompleteLister to get grid column definitions
```

### Custom endpoints using protected verb wrappers

Override in your service class to expose additional endpoints.

```typescript
@Injectable({ providedIn: 'root' })
export class ProductService extends Httpbase {
  constructor() { super('Product'); }

  // POST with custom method name
  async bulkImport(products: Product[]) {
    return this.post<ImportResult>('BulkImport', { products });
  }

  // PUT
  async updateStock(id: number, quantity: number) {
    return this.put<Product>('UpdateStock', { id, quantity });
  }

  // PATCH — partial update
  async setFeatured(id: number, featured: boolean) {
    return this.patch<Product>('SetFeatured', { id, featured });
  }

  // DELETE with multiple query params
  async archiveMany(ids: number[]) {
    return this.delete<void>('ArchiveMany', [
      { property: 'ids', value: ids }  // sends ?ids=1&ids=2&ids=3
    ]);
  }

  // GET with query params
  async getByCategory(categoryId: number, page: number) {
    return this.get<Product[]>('GetByCategory', [
      { property: 'categoryId', value: categoryId },
      { property: 'page',       value: page },
    ]);
  }

  // File upload (multipart/form-data, 60s timeout)
  async uploadImage(productId: number, file: File) {
    const fd = new FormData();
    fd.append('productId', String(productId));
    fd.append('image', file);
    return this.upload<{ imageUrl: string }>('UploadImage', fd);
  }
}
```

### Protected verb wrappers reference

| Method signature | HTTP | Timeout | Notes |
|-----------------|------|---------|-------|
| `post<T>(method, body)` | POST | 30 s | JSON body, auto-sets Content-Type |
| `get<T>(method, params?)` | GET | 30 s | `myParams[]` → query string |
| `put<T>(method, body)` | PUT | 30 s | Full replace |
| `patch<T>(method, body)` | PATCH | 30 s | Partial update |
| `delete<T>(method, params?)` | DELETE | 30 s | `myParams[]` → query string |
| `upload<T>(method, formData)` | POST multipart | 60 s | Never set Content-Type manually |

### `myParams` — query parameter helper

```typescript
interface myParams {
  property: string;  // query param name
  value: any;        // string, number, or array
}

// Array values are expanded: ids=[1,2,3] → ?ids=1&ids=2&ids=3
this.get('Filter', [
  { property: 'status', value: [1, 2] },
  { property: 'page',   value: 1 },
]);
// → GET /api/Controller/Filter?status=1&status=2&page=1
```

### `HttpResponse<T>` — universal response wrapper

Every method returns this, whether the call succeeded or failed:

```typescript
interface HttpResponse<T> {
  isSuccessful: boolean;   // true when statusCode is 2xx
  statusCode: number;      // raw HTTP status code
  error: string;           // human-readable message on failure
  result: T;               // parsed JSON body
  headers?: HttpHeaders;   // raw response headers (useful for pagination totals)
}
```

### Error codes handled automatically

| Status | Message produced |
|--------|-----------------|
| `0` | Connection Error! Please Contact Administration |
| `400` | `error.error.message` or "Bad Request" |
| `401` | Unauthorized Access |
| `403` | You don't have rights to perform this action |
| `404` | Resource not found |
| `409` | `error.error.message` or "Conflict" |
| `422` | `error.error.message` or "Validation failed" |
| `500` | An error has occurred, Please contact support |

### Reading response headers

Useful for server-side pagination — backend can send `X-Total-Count` or similar:

```typescript
const res = await this.productSvc.search(query);
const total = Number(res.headers?.get('recordCount') ?? 0);
this.totalRecords = total;
```

### Proxy configuration (development)

```json
// proxy.conf.json
{
  "/api": {
    "target": "https://your-backend.com",
    "secure": true,
    "changeOrigin": true
  }
}
```

```json
// angular.json — under serve > options
"proxyConfig": "proxy.conf.json"
```

---

## 5. Base UI Service — baseComponent

Injectable service that provides common UI operations. Inject it in any component.

```typescript
import { baseComponent } from 'osl-base-extended';

@Component({ ... })
export class MyComponent {
  private base = inject(baseComponent);
}
```

### Methods

#### `showSuccess(message: string)`

Displays a green Material snackbar.

```typescript
this.base.showSuccess('Record saved successfully.');
```

#### `showError(error: string)`

Displays a red Material snackbar.

```typescript
this.base.showError(res.error);
```

#### `navigate(url: string)`

Navigates using Angular Router.

```typescript
this.base.navigate('/dashboard');
```

#### `openDialog(header, formBody, formFooter, width, data?, component?)`

Opens a Material dialog wrapped in `DialogWrapper`.

```typescript
this.base.openDialog(
  'Edit Profile',       // dialog title
  ProfileFormComponent, // component rendered as form body
  ProfileFooterComponent, // component rendered as footer (save/cancel buttons)
  '60vw',              // dialog width
  { userId: this.userId } // data injected into dialog components
);
```

#### `openDeleteDialog(message, title, confirmText, cancelText, data?)`

Opens the pre-built delete confirmation dialog. Returns a dialog ref — subscribe to `afterClosed()` for the result.

```typescript
this.base.openDeleteDialog(
  `Are you sure you want to delete "${item.name}"?`,
  'Confirm Delete',
  'Yes, Delete',
  'Cancel',
  item
);
```

---

## 6. CRUD UI — osl-setup

The flagship feature. Replaces a full feature module with a single component declaration.

**What it renders automatically:**
- Page heading with an "Add" button
- Search bar (debounced 300ms)
- Data grid with edit and delete action buttons
- Paginated footer
- Add/Edit dialog with the dynamic form
- Delete confirmation dialog

### Minimal example

```typescript
// product.component.ts
@Component({
  template: `
    <osl-setup
      title="Products"
      [columns]="columns"
      [datasource]="products"
      [formElements]="form"
      [loading]="loading"
      [isPaginated]="true"
      [totalRecords]="total"
      (onSave)="onSave($event)"
      (onDelete)="onDelete($event)"
      (onSearch)="onSearch($event)"
      (pageChange)="loadPage($event)"
    />
  `
})
export class ProductComponent {
  private svc    = inject(ProductService);
  private base   = inject(baseComponent);

  loading  = false;
  products: Product[] = [];
  total    = 0;
  page     = 1;

  columns: OslGridColumn[] = [
    { key: 'name',     label: 'Product Name' },
    { key: 'price',    label: 'Price', displayFn: (r) => `$${r.price.toFixed(2)}` },
    { key: 'category', label: 'Category' },
    { key: 'status',   label: 'Status', enums: { 1: 'Active', 0: 'Inactive' } },
  ];

  form: elements[] = [
    { key: 'name',       label: 'Product Name', elementType: 'textbox',  columns: 12, required: true },
    { key: 'price',      label: 'Price',        elementType: 'textbox',  columns: 6,  inputType: 'number' },
    { key: 'categoryId', label: 'Category',     elementType: 'select',   columns: 6,
      datasource: this.categories, displayField: 'name', valueField: 'id' },
    { key: 'status',     label: 'Status',       elementType: 'slide-toggle', columns: 6 },
    { key: 'description', label: 'Description', elementType: 'textarea', columns: 12, textareaRows: 4 },
  ];

  async ngOnInit() { await this.load(); }

  async load() {
    this.loading = true;
    const res = await this.svc.search({ page: this.page, pageSize: 25 });
    this.loading = false;
    if (res.isSuccessful) {
      this.products = res.result;
      this.total = Number(res.headers?.get('recordCount') ?? 0);
    }
  }

  async onSave(e: { model: Product; mode: 'add' | 'edit' }) {
    const res = e.mode === 'add'
      ? await this.svc.save(e.model)
      : await this.svc.update(e.model);
    if (res.isSuccessful) {
      this.base.showSuccess(e.mode === 'add' ? 'Product added!' : 'Product updated!');
      await this.load();
    } else {
      this.base.showError(res.error);
    }
  }

  async onDelete(product: Product) {
    const res = await this.svc.remove(product.id);
    if (res.isSuccessful) {
      this.base.showSuccess('Product deleted.');
      await this.load();
    }
  }

  async onSearch(q: string) {
    // re-query with search term
  }

  async loadPage(e: OslPageEvent) {
    this.page = e.page;
    await this.load();
  }
}
```

### All inputs

| Input | Type | Default | Description |
|-------|------|---------|-------------|
| `title` | `string` | — | Entity label shown in heading and dialog title |
| `columns` | `OslGridColumn[]` | — | Table column definitions |
| `datasource` | `any[]` | — | Rows bound to the table |
| `formElements` | `elements[]` | — | Form configuration for add/edit dialog |
| `loading` | `boolean` | `false` | Triggers skeleton rows in the grid |
| `isPaginated` | `boolean` | `false` | Shows pagination footer |
| `pageSize` | `number` | `25` | Initial page size |
| `totalRecords` | `number` | — | Total row count for server-side pagination |
| `autoMode` | `boolean` | `true` | Library handles client-side sort and pagination internally |
| `tableHeight` | `string` | — | CSS height for scrollable table body (e.g. `'500px'`) |
| `dialogWidth` | `string` | `'50vw'` | Width of the add/edit Material dialog |
| `isLister` | `boolean` | `false` | Hides the edit/delete actions column |
| `beforeDisplay` | `(model: any) => any` | — | Transform the row object before the dialog opens |
| `onAddEditFn` | `(model, mode) => void` | — | Replaces the built-in dialog with a custom handler |

### All outputs

| Output | Payload type | Fires when |
|--------|-------------|-----------|
| `onAdd` | — | Add button clicked |
| `onEdit` | row `any` | Edit button on a row clicked |
| `onDelete` | row `any` | Delete confirmed in the confirmation dialog |
| `onSave` | `{ model: any; mode: 'add' \| 'edit' }` | Save clicked inside the dialog |
| `onSearch` | `string` | Search input emits (300ms debounce) |
| `pageChange` | `OslPageEvent` | Page number changes |
| `pageSizeChange` | `number` | Page size dropdown changes |
| `sortChange` | `OslSortEvent` | Column header clicked for sorting |
| `onRowClick` | row `any` | Any table row is clicked |

---

## 7. Dynamic Forms — DynamicForm

Generates complete, validated, reactive forms from a declarative configuration array. No template code needed beyond the component tag.

```html
<osl-dynamic-form
  [elements]="formConfig"
  [(model)]="formData"
  [skeletonLoading]="loading"
/>
```

The `model` input is two-way bound — changes inside the form propagate out automatically.

### `elements` interface — complete reference

```typescript
interface elements {
  // ── Required ─────────────────────────────────────
  key:         string;                  // model property name
  label:       string;                  // field label
  elementType: ElementType;             // field type (see below)
  columns:     number;                  // 1–12 grid columns

  // ── Visibility & state ───────────────────────────
  disabled?:   boolean;
  hide?:       boolean;
  disabledIf?: () => boolean;
  hideIf?:     (model: any) => boolean;
  loadingIf?:  (model: any) => boolean; // shows spinner on select/autocomplete

  // ── Validation ───────────────────────────────────
  required?:   boolean;
  requiredIf?: (model: any) => boolean;

  // ── Events ───────────────────────────────────────
  change?:     (model: any) => void;    // fires on field value change

  // ── Datasource (select, radio, autocomplete) ─────
  datasource?:    any[];
  displayField?:  string;
  valueField?:    string;

  // ── API-backed datasource ─────────────────────────
  apiService?:       any;              // injected service instance
  apiMethod?:        string;           // method name on service
  apiConfigMethod?:  string;
  apiBody?:          any;

  // ── textbox options ───────────────────────────────
  inputType?:    InputType;            // 'text' | 'password' | 'email' | 'number' | 'tel' | 'url'
  placeholder?:  string;
  mask?:         string;              // e.g. '(000) 000-0000'
  min?:          string | number;
  max?:          string | number;
  minLength?:    number;
  maxLength?:    number;
  prefixIcon?:   string;              // Material icon name
  suffixIcon?:   string;

  // ── textarea options ──────────────────────────────
  textareaRows?:     number;
  characterCounter?: boolean;
  resize?:           TextareaResize; // 'none' | 'both' | 'horizontal' | 'vertical'

  // ── select options ────────────────────────────────
  selectPlaceholder?: string;
  clearable?:         boolean;

  // ── datepicker options ────────────────────────────
  dateType?:  DateInputType; // 'date' | 'datetime-local' | 'time' | 'month' | 'week'
  minDate?:   string;
  maxDate?:   string;
  inline?:    boolean;

  // ── radio / checkbox options ──────────────────────
  labelPosition?: 'before' | 'after';
  indeterminate?: boolean;

  // ── slide-toggle options ──────────────────────────
  trueLabel?:  string;
  falseLabel?: string;

  // ── file upload options ───────────────────────────
  accept?:       string;   // e.g. 'image/*,.pdf'
  multiple?:     boolean;
  maxFileSize?:  number;   // bytes

  // ── autocomplete options ──────────────────────────
  autocompletePlaceholder?: string;
  searchType?:              'Api' | 'Local';
  objectName?:              string;

  // ── fieldset ─────────────────────────────────────
  rows?: elements[];       // nested child elements

  // ── templateRef ──────────────────────────────────
  templateRef?: TemplateRef<any>;
}
```

### Element type reference

| `elementType` | Component rendered | Key options |
|--------------|-------------------|-------------|
| `'textbox'` | `<osl-input>` | `inputType`, `mask`, `prefixIcon`, `suffixIcon`, `min/max`, `minLength/maxLength` |
| `'textarea'` | `<osl-textarea>` | `textareaRows`, `characterCounter`, `resize` |
| `'select'` | `<osl-select>` | `datasource`, `displayField`, `valueField`, `clearable`, `apiService` |
| `'autocomplete'` | `<osl-autocomplete>` | `searchType`, `datasource`, `apiService`, `apiMethod`, `objectName` |
| `'radio'` | `<osl-radio>` | `datasource`, `displayField`, `valueField`, `labelPosition` |
| `'checkbox'` | `<osl-checkbox>` | `labelPosition`, `indeterminate` |
| `'slide-toggle'` | `<osl-slide-toggle>` | `trueLabel`, `falseLabel`, `labelPosition` |
| `'datepicker'` | `<osl-datepicker>` | `dateType`, `minDate`, `maxDate`, `inline` |
| `'file-uploader'` | `<osl-file-upload>` | `accept`, `multiple`, `maxFileSize` |
| `'button'` | `<osl-button>` | `change` (click handler) |
| `'fieldset'` | Container | `rows` (nested `elements[]`) |
| `'templateRef'` | Custom content | `templateRef` |

### Conditional logic example

```typescript
formElements: elements[] = [
  {
    key: 'accountType',
    label: 'Account Type',
    elementType: 'select',
    columns: 6,
    datasource: [
      { id: 'personal', name: 'Personal' },
      { id: 'business', name: 'Business' },
    ],
    displayField: 'name',
    valueField: 'id',
  },
  {
    key: 'companyName',
    label: 'Company Name',
    elementType: 'textbox',
    columns: 6,
    hideIf: (m) => m.accountType !== 'business',
    requiredIf: (m) => m.accountType === 'business',
  },
  {
    key: 'taxId',
    label: 'Tax ID',
    elementType: 'textbox',
    columns: 6,
    hideIf: (m) => m.accountType !== 'business',
    disabledIf: () => !this.hasPermission('TAX_EDIT'),
  },
];
```

### Nested fieldsets

```typescript
{
  key: 'address',
  label: 'Address',
  elementType: 'fieldset',
  columns: 12,
  rows: [
    { key: 'street',  label: 'Street',  elementType: 'textbox', columns: 12 },
    { key: 'city',    label: 'City',    elementType: 'textbox', columns: 6 },
    { key: 'country', label: 'Country', elementType: 'select',  columns: 6,
      datasource: this.countries, displayField: 'name', valueField: 'code' },
  ],
}
```

### API-backed select datasource

The datasource is fetched once and cached via `DatasourceCacheService`:

```typescript
{
  key: 'departmentId',
  label: 'Department',
  elementType: 'select',
  columns: 6,
  apiService: inject(DepartmentService), // must extend Httpbase
  apiMethod: 'getAll',                   // called as service.getAll()
  displayField: 'name',
  valueField: 'id',
}
```

---

## 8. Data Grid — OslGrid

A standalone table component used inside `<osl-setup>` but also available independently.

```html
<osl-grid
  [columns]="columns"
  [datasource]="rows"
  [isPaginated]="true"
  [totalRecords]="total"
  [loading]="loading"
  tableHeight="450px"
  (editClick)="onEdit($event)"
  (deleteClick)="onDelete($event)"
  (pageChange)="onPage($event)"
  (sortChange)="onSort($event)"
  (onRowClick)="onRowSelect($event)"
/>
```

### `OslGridColumn` interface

```typescript
interface OslGridColumn {
  key:        string;                    // model property path
  label:      string;                    // column header
  enums?:     Record<any, string>;       // value map: { 1: 'Active', 0: 'Inactive' }
  displayFn?: (row: any) => string;      // custom cell renderer
  isActions?: boolean;                   // marks the edit/delete column (auto-generated)
}
```

### Inputs

| Input | Type | Default | Description |
|-------|------|---------|-------------|
| `columns` | `OslGridColumn[]` | — | Column definitions |
| `datasource` | `any[]` | — | Row data |
| `isPaginated` | `boolean` | `false` | Show pagination footer |
| `pageSize` | `number` | `25` | Rows per page |
| `totalRecords` | `number` | — | Total count (server-side) |
| `autoMode` | `boolean` | `true` | Library handles pagination/sort internally |
| `tableHeight` | `string` | — | CSS height for scrollable body |
| `loading` | `boolean` | `false` | Show skeleton rows |
| `isSelectable` | `boolean` | `false` | Enable row selection mode |

### Outputs

| Output | Type | Description |
|--------|------|-------------|
| `editClick` | row | Edit button clicked |
| `deleteClick` | row | Delete button clicked |
| `pageChange` | `OslPageEvent` | Page number changes |
| `pageSizeChange` | `number` | Page size dropdown changes |
| `sortChange` | `OslSortEvent` | Column sort toggled |
| `onRowClick` | row | Row clicked |

### Enum display example

```typescript
columns: OslGridColumn[] = [
  {
    key: 'status',
    label: 'Status',
    enums: {
      0: 'Draft',
      1: 'Active',
      2: 'Archived',
    }
  }
];
// Cell shows 'Active' when row.status === 1
```

---

## 9. Inline Form Grid — OslFormGrid

A data grid where cells contain editable form elements.

```html
<osl-form-grid
  [columns]="gridColumns"
  [datasource]="lineItems"
  (rowAdd)="addRow()"
  (rowDelete)="deleteRow($event)"
/>
```

### `OslFormGridColumn` interface

```typescript
interface OslFormGridColumn {
  key:       string;
  label:     string;
  formElem?: elements;   // if present, cell is editable using this config
}
```

---

## 10. Form Components Reference

All form components use the same two-way binding pattern:

```html
<osl-input [(model)]="user.name" label="Name" [required]="true" />
```

### OslButton

```html
<osl-button
  label="Save"
  variant="primary"
  size="md"
  [loading]="saving"
  [disabled]="form.invalid"
  [fullWidth]="false"
  (click)="save()"
/>
```

**Variants:** `primary` | `secondary` | `success` | `danger` | `warning` | `info` | `outline-primary` | `outline-secondary` | `icon`  
**Sizes:** `sm` | `md` | `lg`

### OslInput (textbox)

```html
<osl-input
  [(model)]="value"
  label="Phone"
  inputType="tel"
  mask="(000) 000-0000"
  prefixIcon="phone"
  [maxLength]="15"
  [required]="true"
/>
```

### OslSelect

```html
<osl-select
  [(model)]="form.status"
  label="Status"
  [datasource]="statuses"
  displayField="name"
  valueField="id"
  [clearable]="true"
/>
```

### OslAutocomplete

```html
<!-- Local search -->
<osl-autocomplete
  [(model)]="form.city"
  label="City"
  searchType="Local"
  [datasource]="cities"
  displayField="name"
  valueField="id"
/>

<!-- API search (calls service.search() + opens lister dialog) -->
<osl-autocomplete
  [(model)]="form.customerId"
  label="Customer"
  searchType="Api"
  [apiService]="customerSvc"
  displayField="fullName"
  valueField="id"
  objectName="Customer"
/>
```

### OslDatepicker

```html
<osl-datepicker
  [(model)]="form.startDate"
  label="Start Date"
  dateType="date"
  minDate="2024-01-01"
  maxDate="2030-12-31"
/>
```

**Date types:** `date` | `datetime-local` | `time` | `month` | `week`

### OslFileUpload

```html
<osl-file-upload
  [(model)]="form.attachments"
  label="Attachments"
  accept=".pdf,.docx,image/*"
  [multiple]="true"
  [maxFileSize]="5242880"
/>
```

### OslSlideToggle

```html
<osl-slide-toggle
  [(model)]="form.isActive"
  label="Active"
  trueLabel="Yes"
  falseLabel="No"
/>
```

### OslSearchbar

Debounced search input (300ms). Useful for wiring to server-side data:

```html
<osl-searchbar (search)="onSearch($event)" placeholder="Search products..." />
```

---

## 11. Skeleton Loading — OslSkeletonDirective

Add `[oslSkeleton]="loading"` to any element. The directive overlays the element with animated skeleton bones while loading is `true`.

### Import

```typescript
import { OslSkeletonModule } from 'osl-base-extended';
```

### Basic usage

```html
<!-- Auto-detects child layout -->
<div [oslSkeleton]="isLoading">
  <h2>{{ title }}</h2>
  <p>{{ description }}</p>
</div>
```

### All preset types

```html
<!-- Text rows -->
<div [oslSkeleton]="loading" oslSkeletonType="text" [oslSkeletonRows]="4"></div>

<!-- Rectangle / image placeholder -->
<div [oslSkeleton]="loading" oslSkeletonType="rect" oslSkeletonMinHeight="200px"></div>

<!-- Circle avatar -->
<img [oslSkeleton]="loading" oslSkeletonType="circle" oslSkeletonCircleSize="56px">

<!-- Card (image + lines) -->
<div [oslSkeleton]="loading" oslSkeletonType="card" [oslSkeletonCardLines]="3"></div>

<!-- List -->
<ul [oslSkeleton]="loading" oslSkeletonType="list" [oslSkeletonListItems]="6"></ul>

<!-- Table -->
<table [oslSkeleton]="loading" oslSkeletonType="table"
       [oslSkeletonTableRows]="10" [oslSkeletonTableCols]="5">
</table>

<!-- Avatar + text row -->
<div [oslSkeleton]="loading" oslSkeletonType="avatar-text"></div>
```

### All inputs

| Input | Type | Default | Description |
|-------|------|---------|-------------|
| `oslSkeleton` | `boolean` | — | Main toggle |
| `oslSkeletonType` | string | `'auto'` | Layout preset |
| `oslSkeletonAnimation` | string | `'shimmer'` | `'shimmer'` \| `'pulse'` \| `'wave'` \| `'none'` |
| `oslSkeletonTheme` | string | `'light'` | `'light'` \| `'dark'` |
| `oslSkeletonColor` | string | — | Custom bone background color |
| `oslSkeletonHighlight` | string | — | Custom shimmer highlight color |
| `oslSkeletonRadius` | string | — | Border radius override |
| `oslSkeletonRows` | `number` | `3` | Row count for `type='text'` |
| `oslSkeletonRowGap` | string | `'10px'` | Gap between text rows |
| `oslSkeletonDuration` | `number` | `1500` | Animation duration (ms) |
| `oslSkeletonDelay` | `number` | `0` | Delay before skeleton appears (ms) |
| `oslSkeletonMinHeight` | string | — | Minimum height when host has no size |
| `oslSkeletonCircleSize` | string | `'40px'` | Diameter for `type='circle'` |
| `oslSkeletonListItems` | `number` | `4` | Items for `type='list'` |
| `oslSkeletonTableRows` | `number` | `5` | Rows for `type='table'` |
| `oslSkeletonTableCols` | `number` | `4` | Columns for `type='table'` |
| `oslSkeletonCardLines` | `number` | `3` | Text lines for `type='card'` |
| `oslSkeletonBgColor` | string | — | Overlay background color |
| `oslSkeletonZIndex` | `number` | `10` | Z-index of the overlay |

### Global theme service

```typescript
import { OslSkeletonThemeService } from 'osl-base-extended';

@Component({ ... })
export class AppComponent {
  private theme = inject(OslSkeletonThemeService);

  ngOnInit() {
    // Sync with user's dark mode preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    this.theme.setTheme(prefersDark ? 'dark' : 'light');
  }
}
```

---

## 12. Datasource Cache Service

`DatasourceCacheService` caches API responses for form dropdowns. It is used automatically by `DynamicForm` when `apiService` is set on an element, but can also be used manually.

```typescript
import { DatasourceCacheService } from 'osl-base-extended';

@Component({ ... })
export class MyComponent {
  private cache = inject(DatasourceCacheService);

  async loadCategories() {
    // First call: hits API. Subsequent calls: returns cached value.
    const res = await this.cache.load(this.categorySvc, 'getAll');
    this.categories = res.result ?? [];
  }

  refreshCategories() {
    // Force a fresh API call next time
    this.cache.invalidate(this.categorySvc, 'getAll');
  }

  clearAllCaches() {
    this.cache.invalidateAll();
  }
}
```

**Key feature:** If the same `(service, method, body)` combination is requested while a request is already in flight, the second call waits for the first — no duplicate HTTP requests.

---

## 13. Utility Namespaces

All utilities are tree-shakable pure functions with no external dependencies. Import by namespace:

```typescript
import {
  ArrayUtil, DateUtil, NumberUtil, ObjectUtil,
  StringUtil, StorageUtil, ValidationUtil
} from 'osl-base-extended';
```

### ArrayUtil — 25+ functions

| Function | Signature | Description |
|----------|-----------|-------------|
| `chunk` | `(arr, size)` | Split array into chunks of given size |
| `unique` | `(arr)` | Remove primitive duplicates |
| `uniqueBy` | `(arr, key)` | Remove duplicates by object key |
| `flatten` | `(arr)` | One-level deep flatten |
| `flattenDeep` | `(arr)` | Recursively flatten |
| `groupBy` | `(arr, key)` | Group objects by property value |
| `sortBy` | `(arr, key, dir)` | Sort objects by key ascending/descending |
| `filterBy` | `(arr, key, val)` | Filter objects by key equals value |
| `sumBy` | `(arr, key)` | Sum numeric property |
| `minBy` | `(arr, key)` | Minimum by property |
| `maxBy` | `(arr, key)` | Maximum by property |
| `first` | `(arr)` | First element |
| `last` | `(arr)` | Last element |
| `average` | `(arr)` | Mean of number array |
| `isEmpty` | `(arr)` | True if null or length 0 |
| `paginate` | `(arr, page, size)` | Slice page from array |
| `move` | `(arr, from, to)` | Move element to new index |
| `toggle` | `(arr, item)` | Add if absent, remove if present |
| `intersection` | `(a, b)` | Elements in both arrays |
| `difference` | `(a, b)` | Elements in a not in b |
| `toMap` | `(arr, key)` | Array to `Map` by key |
| `compact` | `(arr)` | Remove falsy values |
| `shuffle` | `(arr)` | Random order (Fisher-Yates) |
| `sample` | `(arr, n)` | n random elements |
| `countBy` | `(arr, key)` | Count occurrences per key value |
| `union` | `(a, b)` | Unique merge of two arrays |
| `zip` | `(a, b)` | Pair elements by index |
| `every` | `(arr, pred)` | All elements satisfy predicate |
| `some` | `(arr, pred)` | Any element satisfies predicate |
| `partition` | `(arr, pred)` | Split into [truthy, falsy] |

### DateUtil — 40+ functions

| Function | Description |
|----------|-------------|
| `now()` | Current `Date` |
| `today()` | Today at midnight |
| `formatDate(date, pattern)` | Pattern: `YYYY`, `MM`, `DD`, `HH`, `mm`, `ss` |
| `toDateOnly(date)` | `'YYYY-MM-DD'` string |
| `toISOString(date)` | ISO 8601 string |
| `parseDate(str)` | Parse `'YYYY-MM-DD'` string |
| `isValidDate(date)` | True if valid Date object |
| `addDays / subDays` | Add or subtract days |
| `addMonths / subMonths` | Add or subtract months |
| `addYears / subYears` | Add or subtract years |
| `addHours / subHours` | Add or subtract hours |
| `addMinutes / subMinutes` | Add or subtract minutes |
| `diffInDays(a, b)` | Absolute day difference |
| `diffInMonths(a, b)` | Absolute month difference |
| `diffInYears(a, b)` | Absolute year difference |
| `diffInMinutes(a, b)` | Absolute minute difference |
| `isBefore(a, b)` | a is before b |
| `isAfter(a, b)` | a is after b |
| `isSameDay(a, b)` | Same calendar day |
| `isToday(date)` | Is today |
| `isWeekend(date)` | Saturday or Sunday |
| `isPast(date)` | In the past |
| `isFuture(date)` | In the future |
| `inRange(date, start, end)` | Within inclusive range |
| `startOfDay / endOfDay` | Midnight / 23:59:59 |
| `startOfMonth / endOfMonth` | First / last day of month |
| `startOfYear / endOfYear` | First / last day of year |
| `getAge(birthDate)` | Age in years |
| `daysInMonth(date)` | Days in the month |
| `isLeapYear(year)` | Leap year check |
| `getWeekNumber(date)` | ISO week number |
| `nextWorkday(date)` | Next Monday–Friday |
| `timeAgo(date)` | `'3 hours ago'` / `'2 days ago'` |

### NumberUtil — 30+ functions

| Function | Description |
|----------|-------------|
| `round(n, decimals)` | Round to N decimal places |
| `floor / ceil` | Math.floor / Math.ceil |
| `clamp(n, min, max)` | Constrain to range |
| `formatCurrency(n, currency)` | `'$1,500.00'` |
| `formatNumber(n, decimals)` | Locale-formatted number string |
| `abbreviate(n)` | `1500000` → `'1.5M'` |
| `toOrdinal(n)` | `3` → `'3rd'` |
| `percentage(part, total)` | `(part / total) * 100` |
| `sum(arr)` | Sum number array |
| `average(arr)` | Mean of number array |
| `min / max` | Minimum / maximum |
| `random(min, max)` | Random float in range |
| `randomInt(min, max)` | Random integer in range |
| `inRange(n, min, max)` | True if n within range |
| `lerp(a, b, t)` | Linear interpolation |
| `isPrime(n)` | Primality test |
| `isEven / isOdd` | Parity check |
| `isPositive / isNegative` | Sign check |
| `isFiniteNumber / isNaNValue / isInteger` | Type guards |
| `gcd(a, b)` | Greatest common divisor |
| `lcm(a, b)` | Lowest common multiple |
| `fibonacci(n)` | nth Fibonacci number |
| `toRadians / toDegrees` | Angle conversion |
| `safeParseFloat / safeParseInt` | Returns `null` instead of `NaN` |

### ObjectUtil — 25+ functions

| Function | Description |
|----------|-------------|
| `deepClone(obj)` | Recursive clone (JSON-safe) |
| `deepMerge(target, source)` | Recursive merge |
| `isPlainObject(val)` | True if plain `{}` object |
| `isEmpty(obj)` | True if no own keys |
| `isEqual(a, b)` | Deep equality check |
| `hasKey(obj, key)` | Own key exists |
| `hasPath(obj, path)` | Dot-notation path exists |
| `pick(obj, keys)` | New object with only listed keys |
| `omit(obj, keys)` | New object without listed keys |
| `filterValues(obj, pred)` | Keep entries where predicate is true |
| `mapValues(obj, fn)` | Transform all values |
| `diff(a, b)` | Keys that differ between objects |
| `flattenObject(obj)` | `{ 'a.b.c': val }` |
| `unflattenObject(obj)` | Reverse of flatten |
| `getPath(obj, 'a.b.c')` | Safe nested get |
| `setPath(obj, 'a.b.c', val)` | Safe nested set (mutates) |
| `toQueryString(obj)` | `'key=val&key2=val2'` |
| `fromQueryString(str)` | Parse query string to object |
| `invertObject(obj)` | Swap keys and values |
| `sortByKey(obj)` | Sort keys alphabetically |
| `size(obj)` | Number of own keys |

### StringUtil — 35+ functions

| Function | Description |
|----------|-------------|
| `capitalize(str)` | First letter uppercase |
| `titleCase(str)` | Each Word Capitalized |
| `camelCase(str)` | `helloWorldFoo` |
| `pascalCase(str)` | `HelloWorldFoo` |
| `snakeCase(str)` | `hello_world_foo` |
| `kebabCase(str)` | `hello-world-foo` |
| `isEmpty / isBlank` | Null/empty vs whitespace-only |
| `contains(str, sub)` | Substring check |
| `countWords(str)` | Word count |
| `isPalindrome(str)` | Forward equals reverse |
| `truncate(str, len, suffix?)` | Shorten with ellipsis |
| `stripHtml(str)` | Remove all tags |
| `escapeHtml(str)` | Encode `< > & " '` |
| `unescapeHtml(str)` | Decode HTML entities |
| `toSlug(str)` | URL-safe slug |
| `removeSpecialChars(str)` | Keep alphanumeric only |
| `removeWhitespace(str)` | Remove all spaces |
| `mask(str, visibleEnd)` | `'****1234'` |
| `initials(str)` | `'Bilal Raza'` → `'BR'` |
| `countOccurrences(str, sub)` | Count substring occurrences |
| `format(template, ...args)` | `'Hello {0}!'` → `'Hello World!'` |
| `repeat(str, n)` | Repeat string n times |
| `reverseString(str)` | Reverse characters |
| `wordWrap(str, width)` | Insert newlines at word boundaries |
| `padStart / padEnd` | Left/right pad to length |
| `randomString(len)` | Random alphanumeric |
| `toBoolean(str)` | `'true'`/`'1'`/`'yes'` → `true` |

### StorageUtil

```typescript
// localStorage — persists across sessions
StorageUtil.setLocal('key', value);         // JSON.stringify internally
StorageUtil.getLocal<T>('key');             // JSON.parse — returns null if missing
StorageUtil.removeLocal('key');
StorageUtil.clearLocal();
StorageUtil.hasLocal('key');
StorageUtil.localKeys();                    // string[]

// sessionStorage — cleared on tab close
StorageUtil.setSession('key', value);
StorageUtil.getSession<T>('key');
StorageUtil.removeSession('key');
StorageUtil.clearSession();
StorageUtil.hasSession('key');
StorageUtil.sessionKeys();

// Cookies
StorageUtil.setCookie('key', 'value', 30); // 30 days expiry
StorageUtil.getCookie('key');
StorageUtil.removeCookie('key');
StorageUtil.getAllCookies();                // Record<string, string>
StorageUtil.hasCookie('key');
```

### ValidationUtil — 40+ functions

```typescript
// Format validators (return boolean)
ValidationUtil.isEmail(str)
ValidationUtil.isUrl(str)
ValidationUtil.isPhone(str)
ValidationUtil.isPostalCode(str)
ValidationUtil.isIPv4(str)
ValidationUtil.isIPv6(str)
ValidationUtil.isMACAddress(str)
ValidationUtil.isHexColor(str)
ValidationUtil.isCreditCard(str)          // Luhn algorithm
ValidationUtil.isJSON(str)
ValidationUtil.isASCII(str)
ValidationUtil.isAlpha(str)
ValidationUtil.isAlphanumeric(str)
ValidationUtil.isNumeric(str)
ValidationUtil.isDecimal(str)

// Required / empty
ValidationUtil.isRequired(val)
ValidationUtil.isEmpty(str)

// Length
ValidationUtil.minLength(str, n)
ValidationUtil.maxLength(str, n)
ValidationUtil.lengthBetween(str, min, max)

// Number range
ValidationUtil.minValue(n, min)
ValidationUtil.maxValue(n, max)
ValidationUtil.inRange(n, min, max)
ValidationUtil.isPositive(n)
ValidationUtil.isNegative(n)
ValidationUtil.isInteger(n)

// Date
ValidationUtil.isValidDate(date)

// Pattern
ValidationUtil.matchesPattern(str, regex)

// Equality
ValidationUtil.isMatch(a, b)

// Password strength
ValidationUtil.isStrongPassword(str, {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecial: true,
})
ValidationUtil.passwordStrength(str)  // 0 (very weak) → 5 (very strong)
```

---

## 14. Full TypeScript Interface Reference

```typescript
// ─── HTTP ────────────────────────────────────────────────────────────────────

interface HttpResponse<T = any> {
  isSuccessful: boolean;
  statusCode:   number;
  error:        string;
  result:       T;
  headers?:     HttpHeaders;
}

interface myParams {
  property: string;
  value:    any;
}

// ─── Grid ────────────────────────────────────────────────────────────────────

interface OslGridColumn {
  key:        string;
  label:      string;
  enums?:     Record<any, string>;
  displayFn?: (row: any) => string;
  isActions?: boolean;
}

interface OslPageEvent {
  page:     number;
  pageSize: number;
}

interface OslSortEvent {
  key:       string;
  direction: 'asc' | 'desc';
}

// ─── Form Grid ───────────────────────────────────────────────────────────────

interface OslFormGridColumn {
  key:       string;
  label:     string;
  formElem?: elements;
}

interface OslFormGridRowEvent {
  row:   any;
  index: number;
}

// ─── Dynamic Form ────────────────────────────────────────────────────────────

type ElementType =
  | 'button' | 'checkbox' | 'textbox' | 'textarea' | 'radio'
  | 'select' | 'datepicker' | 'file-uploader' | 'autocomplete'
  | 'slide-toggle' | 'fieldset' | 'templateRef';

type InputType      = 'text' | 'password' | 'email' | 'number' | 'tel' | 'url';
type DateInputType  = 'date' | 'datetime-local' | 'time' | 'month' | 'week';
type TextareaResize = 'none' | 'both' | 'horizontal' | 'vertical';

interface elements {
  key:          string;
  label:        string;
  elementType:  ElementType;
  columns:      number;
  disabled?:    boolean;
  hide?:        boolean;
  required?:    boolean;
  disabledIf?:  () => boolean;
  hideIf?:      (model: any) => boolean;
  requiredIf?:  (model: any) => boolean;
  loadingIf?:   (model: any) => boolean;
  change?:      (model: any) => void;
  datasource?:  any[];
  displayField?: string;
  valueField?:  string;
  apiService?:  any;
  apiMethod?:   string;
  apiConfigMethod?: string;
  apiBody?:     any;
  inputType?:   InputType;
  placeholder?: string;
  mask?:        string;
  min?:         string | number;
  max?:         string | number;
  minLength?:   number;
  maxLength?:   number;
  prefixIcon?:  string;
  suffixIcon?:  string;
  textareaRows?:     number;
  characterCounter?: boolean;
  resize?:           TextareaResize;
  selectPlaceholder?: string;
  clearable?:   boolean;
  dateType?:    DateInputType;
  minDate?:     string;
  maxDate?:     string;
  inline?:      boolean;
  labelPosition?: 'before' | 'after';
  trueLabel?:   string;
  falseLabel?:  string;
  accept?:      string;
  multiple?:    boolean;
  maxFileSize?: number;
  indeterminate?: boolean;
  autocompletePlaceholder?: string;
  templateRef?: TemplateRef<any>;
  searchType?:  'Api' | 'Local';
  objectName?:  string;
  rows?:        elements[];
}

// ─── Button ──────────────────────────────────────────────────────────────────

type ButtonVariant =
  | 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info'
  | 'outline-primary' | 'outline-secondary' | 'icon';

type ButtonSize = 'sm' | 'md' | 'lg';

// ─── Dialog ──────────────────────────────────────────────────────────────────

interface Dialog {
  header:    string;
  formBody:  any;
  formFooter?: any;
  width:     string;
  data?:     any;
  component?: any;
  dialogRef?: MatDialogRef<any>;
}

interface DeleteConfirmationData {
  title:       string;
  message:     string;
  confirmText: string;
  cancelText:  string;
  data?:       any;
}

// ─── Password ────────────────────────────────────────────────────────────────

interface PasswordOptions {
  minLength?:        number;  // default 8
  requireUppercase?: boolean;
  requireLowercase?: boolean;
  requireNumber?:    boolean;
  requireSpecial?:   boolean;
}
```

---

## 15. Advanced Patterns

### Server-side pagination with osl-setup

```typescript
async onPageChange(e: OslPageEvent) {
  this.currentPage = e.page;
  await this.loadData();
}

async onPageSizeChange(size: number) {
  this.pageSize = size;
  this.currentPage = 1;
  await this.loadData();
}

async onSortChange(e: OslSortEvent) {
  this.sortKey = e.key;
  this.sortDir = e.direction;
  await this.loadData();
}

private async loadData() {
  this.loading = true;
  const res = await this.svc.search({
    page:     this.currentPage,
    pageSize: this.pageSize,
    sortKey:  this.sortKey,
    sortDir:  this.sortDir,
    query:    this.searchQuery,
  });
  this.loading = false;
  if (res.isSuccessful) {
    this.datasource   = res.result;
    this.totalRecords = Number(res.headers?.get('recordCount') ?? 0);
  }
}
```

### Form with cascading dropdowns

```typescript
formElements: elements[] = [
  {
    key: 'countryId',
    label: 'Country',
    elementType: 'select',
    columns: 6,
    datasource: this.countries,
    displayField: 'name',
    valueField: 'id',
    change: (model) => {
      // Clear city when country changes
      model.cityId = null;
      // Reload cities
      this.loadCities(model.countryId);
    },
  },
  {
    key: 'cityId',
    label: 'City',
    elementType: 'select',
    columns: 6,
    datasource: this.cities,        // update this array on change above
    displayField: 'name',
    valueField: 'id',
    disabledIf: () => !this.formModel.countryId,
  },
];
```

### Multiple services — domain separation

```typescript
// auth.service.ts
@Injectable({ providedIn: 'root' })
export class AuthService extends Httpbase {
  constructor() { super('Auth'); }
  async login(body: LoginDto)  { return this.post<TokenDto>('Login', body); }
  async logout()               { return this.post<void>('Logout', {}); }
  async refreshToken()         { return this.post<TokenDto>('Refresh', {}); }
}

// user.service.ts
@Injectable({ providedIn: 'root' })
export class UserService extends Httpbase {
  constructor() { super('User'); }
  // getAll, getById, save, update, remove all inherited
  async changePassword(dto: ChangePasswordDto) {
    return this.patch<void>('ChangePassword', dto);
  }
}

// report.service.ts
@Injectable({ providedIn: 'root' })
export class ReportService extends Httpbase {
  constructor() { super('Report'); }
  async export(params: ExportParams) {
    return this.post<Blob>('Export', params);
  }
}
```

### File upload with progress tracking

```typescript
async uploadDocument(file: File) {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('entityId', String(this.entityId));

  const res = await this.docSvc.upload<{ id: number; url: string }>('Upload', fd);

  if (res.isSuccessful) {
    this.base.showSuccess('Document uploaded successfully.');
    this.attachments.push(res.result);
  } else {
    this.base.showError(res.error);
  }
}
```

### Skeleton with reactive theme switching

```typescript
@Component({
  template: `
    <button (click)="toggleDark()">Toggle Dark Mode</button>

    <div [oslSkeleton]="loading"
         oslSkeletonType="table"
         [oslSkeletonTableRows]="10">
      <table>...</table>
    </div>
  `
})
export class DashboardComponent {
  private skeletonTheme = inject(OslSkeletonThemeService);
  isDark = false;

  toggleDark() {
    this.isDark = !this.isDark;
    this.skeletonTheme.setTheme(this.isDark ? 'dark' : 'light');
  }
}
```

---

## 16. Troubleshooting

### `NullInjectorError: No provider for HttpClient`

Add `provideHttpClient()` to your app config:

```typescript
// app.config.ts
providers: [provideHttpClient()]
```

### Dialog components are not rendering

Ensure your feature components are declared in the same module as `FormStructureModule`, or are standalone components.

### Skeleton does not appear on a flex/grid child

Set a minimum height on the host element:

```html
<div [oslSkeleton]="loading" oslSkeletonMinHeight="200px"></div>
```

### API datasource in form loads on every dialog open

`DatasourceCacheService` caches per `(service, method, body)` key. If the datasource is not being cached, verify the `apiService` reference is the same injected instance (not a new object) every time the form opens.

### `beforeDisplay` not called on edit

`beforeDisplay` is only called when opening the edit dialog. Pass a pure function — it receives the row object and must return the transformed model:

```typescript
beforeDisplay = (row: Product) => ({
  ...row,
  price: row.price * 100,  // convert cents to display value
});
```

### JWT token not sent on requests

The service reads `localStorage.getItem('token')`. Verify the key name matches exactly — it is case-sensitive.

---

*osl-base-extended — © Bilal Raza — ISC License*  
*To convert this file to PDF: use VS Code "Markdown PDF" extension, `md-to-pdf DOCS.md`, or Pandoc.*
