# osl-base-extended

> **Enterprise Angular UI toolkit** — HTTP layer, CRUD UI, dynamic forms, skeleton loading, and 200+ utilities. Build data-driven pages in minutes, not days.

[![npm version](https://img.shields.io/npm/v/osl-base-extended)](https://www.npmjs.com/package/osl-base-extended)
[![Angular](https://img.shields.io/badge/Angular-21%2B-red)](https://angular.dev)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)
[![Author](https://img.shields.io/badge/author-Bilal%20Raza-informational)](https://github.com/bilalraza052)

---

## What's Inside

| Module | What it does |
|--------|-------------|
| **`Httpbase`** | Abstract HTTP service — extend once per domain, get CRUD + auth + error handling free |
| **`<osl-setup>`** | Zero-config CRUD page: grid + add/edit dialog + delete confirm + search + pagination |
| **`<osl-dynamic-form>`** | Declarative forms — 12+ field types from a JSON config array |
| **`<osl-grid>`** | Data table with server-side or auto pagination, sorting, enum display |
| **`<osl-form-grid>`** | Inline editable grid with dynamic form elements per cell |
| **`[oslSkeleton]`** | GPU-accelerated skeleton directive — 8 layouts, 4 animations, 1 attribute |
| **`baseComponent`** | Inject once: `showSuccess()`, `showError()`, `openDialog()`, `openDeleteDialog()` |
| **`ArrayUtil`** | 25+ array helpers: chunk, groupBy, sortBy, paginate, intersection… |
| **`DateUtil`** | 40+ date helpers: format, diff, add/subtract, timeAgo, getAge… |
| **`NumberUtil`** | 30+ number helpers: formatCurrency, abbreviate, clamp, isPrime… |
| **`ObjectUtil`** | 25+ object helpers: deepClone, deepMerge, pick, omit, flattenObject… |
| **`StringUtil`** | 35+ string helpers: camelCase, slugify, truncate, mask, escapeHtml… |
| **`StorageUtil`** | localStorage, sessionStorage, and cookie helpers with JSON serialization |
| **`ValidationUtil`** | 40+ validators: email, URL, phone, password strength, credit card (Luhn)… |

---

## Installation

```bash
npm install osl-base-extended
```

### Peer dependencies

```bash
npm install @angular/material
```

### Add `HttpClientModule` to your app

```typescript
// app.config.ts
import { provideHttpClient } from '@angular/common/http';

export const appConfig: ApplicationConfig = {
  providers: [provideHttpClient()]
};
```

---

## API Calling — Httpbase

The core of the library. Create one service per backend controller by extending `Httpbase`.

### 1. Create a service

```typescript
// user.service.ts
import { Injectable } from '@angular/core';
import { Httpbase } from 'osl-base-extended';

@Injectable({ providedIn: 'root' })
export class UserService extends Httpbase {
  constructor() {
    super('User'); // maps to /api/User/...
  }
}
```

### 2. Call built-in CRUD methods — no extra code needed

```typescript
// user.component.ts
export class UserComponent {
  private userSvc = inject(UserService);

  async loadAll() {
    const res = await this.userSvc.getAll<User[]>();
    if (res.isSuccessful) this.users = res.result;
    else this.base.showError(res.error);
  }

  async loadOne(id: number) {
    const res = await this.userSvc.getById<User>(id);
  }

  async create(user: User) {
    const res = await this.userSvc.save<User>(user);
  }

  async edit(user: User) {
    const res = await this.userSvc.update<User>(user);
  }

  async remove(id: number) {
    const res = await this.userSvc.remove(id);
  }
}
```

### Built-in public methods

| Method | HTTP verb | Endpoint hit |
|--------|-----------|-------------|
| `getAll<T>()` | GET | `/api/{controller}/GetAll` |
| `getById<T>(id)` | GET | `/api/{controller}/GetById?id=…` |
| `save<T>(body)` | POST | `/api/{controller}/Save` |
| `update<T>(body)` | PUT | `/api/{controller}/Update` |
| `remove<T>(id)` | DELETE | `/api/{controller}/Delete?id=…` |
| `search(body)` | POST | `/api/{controller}/Search` |
| `getConfig()` | GET | `/api/{controller}/getConfig` |

### Custom endpoints — protected verb wrappers

```typescript
@Injectable({ providedIn: 'root' })
export class UserService extends Httpbase {
  constructor() { super('User'); }

  // Custom POST
  async changePassword(body: ChangePasswordDto) {
    return this.post<void>('ChangePassword', body);
  }

  // Custom PUT
  async updateRole(body: UpdateRoleDto) {
    return this.put<User>('UpdateRole', body);
  }

  // Custom PATCH
  async toggleActive(id: number) {
    return this.patch<User>('ToggleActive', { id });
  }

  // Custom DELETE with query params
  async bulkDelete(ids: number[]) {
    return this.delete<void>('BulkDelete', [{ property: 'ids', value: ids }]);
  }

  // File upload (multipart/form-data)
  async uploadAvatar(file: File) {
    const fd = new FormData();
    fd.append('file', file);
    return this.upload<{ url: string }>('UploadAvatar', fd);
  }
}
```

### Protected verb wrappers

| Method | HTTP verb | Notes |
|--------|-----------|-------|
| `post<T>(method, body)` | POST | JSON body |
| `get<T>(method, params?)` | GET | query params via `myParams[]` |
| `put<T>(method, body)` | PUT | JSON body |
| `patch<T>(method, body)` | PATCH | JSON body |
| `delete<T>(method, params?)` | DELETE | query params |
| `upload<T>(method, formData)` | POST multipart | 60 s timeout |

### `HttpResponse<T>` — every method returns this

```typescript
interface HttpResponse<T> {
  isSuccessful: boolean;  // true for 2xx
  statusCode: number;
  error: string;          // human-readable error message
  result: T;              // response body
  headers?: HttpHeaders;
}
```

### Authentication

The service reads `token` from `localStorage` and sends it as `Authorization: Bearer <token>` on every request automatically.

```typescript
localStorage.setItem('token', 'your-jwt-here');
```

---

## CRUD UI — `<osl-setup>`

The flagship component. One tag replaces a full page of boilerplate.

### Template

```html
<osl-setup
  title="Users"
  [columns]="columns"
  [datasource]="users"
  [formElements]="formElements"
  [loading]="loading"
  [isPaginated]="true"
  [totalRecords]="totalRecords"
  (onAdd)="onAdd()"
  (onEdit)="onEdit($event)"
  (onDelete)="onDelete($event)"
  (onSave)="onSave($event)"
  (onSearch)="onSearch($event)"
  (pageChange)="onPageChange($event)"
/>
```

### Component

```typescript
export class UsersComponent {
  loading = false;
  users: User[] = [];
  totalRecords = 0;

  columns: OslGridColumn[] = [
    { key: 'name',   label: 'Name' },
    { key: 'email',  label: 'Email' },
    { key: 'status', label: 'Status', enums: { 1: 'Active', 0: 'Inactive' } },
  ];

  formElements: elements[] = [
    { key: 'name',  label: 'Full Name',  elementType: 'textbox',  columns: 6, required: true },
    { key: 'email', label: 'Email',      elementType: 'textbox',  columns: 6, required: true,
      inputType: 'email' },
    { key: 'status', label: 'Status',   elementType: 'select',   columns: 6,
      datasource: [{ id: 1, name: 'Active' }, { id: 0, name: 'Inactive' }],
      displayField: 'name', valueField: 'id' },
  ];

  async onSave(e: { model: User; mode: 'add' | 'edit' }) {
    const res = e.mode === 'add'
      ? await this.userSvc.save(e.model)
      : await this.userSvc.update(e.model);
    if (res.isSuccessful) this.loadUsers();
    else this.base.showError(res.error);
  }

  async onDelete(user: User) {
    const res = await this.userSvc.remove(user.id);
    if (res.isSuccessful) this.loadUsers();
  }
}
```

### `<osl-setup>` inputs

| Input | Type | Default | Description |
|-------|------|---------|-------------|
| `title` | `string` | — | Entity name shown in heading and dialog |
| `columns` | `OslGridColumn[]` | — | Column definitions |
| `datasource` | `any[]` | — | Table row data |
| `formElements` | `elements[]` | — | Dynamic form configuration |
| `loading` | `boolean` | `false` | Shows skeleton rows while loading |
| `isPaginated` | `boolean` | `false` | Enable pagination footer |
| `pageSize` | `number` | `25` | Rows per page |
| `totalRecords` | `number` | — | Total count for server-side pagination |
| `autoMode` | `boolean` | `true` | Library handles client-side sort/page |
| `tableHeight` | `string` | — | CSS height for scrollable table body |
| `dialogWidth` | `string` | `'50vw'` | Width of add/edit dialog |
| `isLister` | `boolean` | `false` | Hides actions column |
| `beforeDisplay` | `(model) => any` | — | Transform model before opening dialog |
| `onAddEditFn` | `(model, mode) => void` | — | Override default add/edit dialog |

### `<osl-setup>` outputs

| Output | Payload | When |
|--------|---------|------|
| `onAdd` | — | Add button clicked |
| `onEdit` | row object | Edit button clicked |
| `onDelete` | row object | Delete confirmed |
| `onSave` | `{ model, mode }` | Dialog save button clicked |
| `onSearch` | `string` | Search input changes |
| `pageChange` | `OslPageEvent` | Page number changes |
| `pageSizeChange` | `number` | Page size changes |
| `sortChange` | `OslSortEvent` | Column header clicked |
| `onRowClick` | row object | Row clicked |

---

## Dynamic Forms — `<osl-dynamic-form>`

Build any form from a plain array — no template code needed.

```html
<osl-dynamic-form
  [elements]="formElements"
  [(model)]="formModel"
  [skeletonLoading]="loading"
/>
```

### Element types

| `elementType` | Renders |
|---------------|---------|
| `textbox` | `<osl-input>` — text, password, email, number, tel, url |
| `textarea` | `<osl-textarea>` — resizable, character counter |
| `select` | `<osl-select>` — static or API datasource |
| `autocomplete` | `<osl-autocomplete>` — local or API search with lister |
| `radio` | `<osl-radio>` — horizontal/vertical layout |
| `checkbox` | `<osl-checkbox>` — with indeterminate support |
| `slide-toggle` | `<osl-slide-toggle>` — custom true/false labels |
| `datepicker` | `<osl-datepicker>` — date, datetime-local, time, month, week |
| `file-uploader` | `<osl-file-upload>` — drag & drop, size validation |
| `button` | `<osl-button>` — all variants and sizes |
| `fieldset` | Nested group of elements |
| `templateRef` | Inject a custom `TemplateRef` |

### Common element options

```typescript
{
  key: 'fieldName',           // maps to model property
  label: 'Display Label',
  elementType: 'textbox',
  columns: 6,                 // 1–12 grid columns (Bootstrap-style)
  required: true,
  requiredIf: (m) => m.type === 'enterprise',
  hideIf: (m) => !m.showField,
  disabledIf: () => !hasPermission,
  change: (model) => { /* react to value change */ },

  // select / autocomplete
  datasource: [],
  displayField: 'name',
  valueField: 'id',

  // API-backed datasource
  apiService: inject(CategoryService),
  apiMethod: 'getAll',

  // textbox extras
  inputType: 'email',
  placeholder: 'Enter email',
  mask: '(000) 000-0000',
  prefixIcon: 'person',
  suffixIcon: 'clear',
  maxLength: 100,
}
```

---

## Data Grid — `<osl-grid>`

```html
<osl-grid
  [columns]="columns"
  [datasource]="rows"
  [isPaginated]="true"
  [totalRecords]="total"
  [loading]="loading"
  tableHeight="400px"
  (editClick)="onEdit($event)"
  (deleteClick)="onDelete($event)"
  (pageChange)="loadPage($event)"
  (sortChange)="onSort($event)"
/>
```

### `OslGridColumn` interface

```typescript
interface OslGridColumn {
  key: string;                       // model property
  label: string;                     // header text
  enums?: Record<any, string>;       // value → display label map
  displayFn?: (row: any) => string;  // custom cell renderer
  isActions?: boolean;               // marks the edit/delete column
}
```

---

## Skeleton Loading — `[oslSkeleton]`

Drop one attribute on any element.

```html
<!-- Auto-detects child structure -->
<div [oslSkeleton]="loading">...</div>

<!-- Explicit types -->
<table [oslSkeleton]="loading" oslSkeletonType="table"
       [oslSkeletonTableRows]="8" [oslSkeletonTableCols]="4">
</table>

<ul [oslSkeleton]="loading" oslSkeletonType="list" [oslSkeletonListItems]="5"></ul>

<div [oslSkeleton]="loading" oslSkeletonType="card"></div>

<img [oslSkeleton]="loading" oslSkeletonType="circle" oslSkeletonCircleSize="48px">
```

### Key inputs

| Input | Type | Default | Description |
|-------|------|---------|-------------|
| `oslSkeleton` | `boolean` | — | Toggle on/off |
| `oslSkeletonType` | `'auto'│'text'│'rect'│'circle'│'card'│'list'│'table'│'avatar-text'` | `'auto'` | Layout preset |
| `oslSkeletonAnimation` | `'shimmer'│'pulse'│'wave'│'none'` | `'shimmer'` | Animation style |
| `oslSkeletonTheme` | `'light'│'dark'` | `'light'` | Color theme |
| `oslSkeletonRows` | `number` | `3` | Text rows count |
| `oslSkeletonTableRows` | `number` | `5` | Table row count |
| `oslSkeletonTableCols` | `number` | `4` | Table column count |
| `oslSkeletonListItems` | `number` | `4` | List item count |
| `oslSkeletonDuration` | `number` | `1500` | Animation ms |
| `oslSkeletonDelay` | `number` | `0` | Delay before showing |

### Global theme

```typescript
// Set once in a root component
inject(OslSkeletonThemeService).setTheme('dark');
```

---

## `baseComponent` — UI Utilities

```typescript
export class MyComponent {
  private base = inject(baseComponent);

  showFeedback(res: HttpResponse<any>) {
    if (res.isSuccessful) this.base.showSuccess('Saved!');
    else this.base.showError(res.error);
  }

  openCustomDialog() {
    this.base.openDialog(
      'Edit User',
      MyFormComponent,   // formBody
      MyFooterComponent, // formFooter
      '40vw',
      { userId: 1 }      // data passed to dialog
    );
  }

  confirmDelete(item: any) {
    this.base.openDeleteDialog(
      `Delete "${item.name}"?`,
      'Confirm Delete',
      'Yes, Delete',
      'Cancel',
      item
    );
  }
}
```

---

## Utility Namespaces

Import by namespace — tree-shakable pure functions, no external dependencies.

```typescript
import { ArrayUtil, DateUtil, NumberUtil, ObjectUtil,
         StringUtil, StorageUtil, ValidationUtil } from 'osl-base-extended';
```

### ArrayUtil

```typescript
ArrayUtil.chunk([1,2,3,4,5], 2)          // [[1,2],[3,4],[5]]
ArrayUtil.unique([1,1,2,3,2])             // [1,2,3]
ArrayUtil.uniqueBy(users, 'email')
ArrayUtil.groupBy(orders, 'status')
ArrayUtil.sortBy(items, 'price', 'asc')
ArrayUtil.filterBy(items, 'category', 'Electronics')
ArrayUtil.paginate(items, 2, 10)          // page 2, 10 per page
ArrayUtil.flatten([[1,[2]],3])
ArrayUtil.sumBy(cart, 'total')
ArrayUtil.intersection([1,2,3],[2,3,4])  // [2,3]
ArrayUtil.difference([1,2,3],[2,3])      // [1]
ArrayUtil.toggle(selected, item)          // add if missing, remove if present
ArrayUtil.shuffle(deck)
ArrayUtil.sample(pool, 3)                 // random 3
ArrayUtil.zip(['a','b'],[1,2])           // [['a',1],['b',2]]
```

### DateUtil

```typescript
DateUtil.formatDate(new Date(), 'YYYY-MM-DD')
DateUtil.timeAgo(pastDate)               // '3 hours ago'
DateUtil.getAge(birthDate)               // 28
DateUtil.addDays(date, 7)
DateUtil.addMonths(date, 3)
DateUtil.diffInDays(dateA, dateB)
DateUtil.diffInMinutes(dateA, dateB)
DateUtil.isBefore(dateA, dateB)
DateUtil.isToday(date)
DateUtil.isWeekend(date)
DateUtil.startOfMonth(date)
DateUtil.endOfMonth(date)
DateUtil.nextWorkday(date)
DateUtil.getWeekNumber(date)
DateUtil.isLeapYear(2024)               // true
```

### NumberUtil

```typescript
NumberUtil.formatCurrency(1500.5, 'USD')  // '$1,500.50'
NumberUtil.abbreviate(1500000)             // '1.5M'
NumberUtil.toOrdinal(3)                    // '3rd'
NumberUtil.clamp(value, 0, 100)
NumberUtil.percentage(part, total)
NumberUtil.round(3.14159, 2)              // 3.14
NumberUtil.randomInt(1, 100)
NumberUtil.isPrime(17)                    // true
NumberUtil.fibonacci(10)                  // 55
NumberUtil.lerp(0, 100, 0.5)            // 50
```

### ObjectUtil

```typescript
ObjectUtil.deepClone(obj)
ObjectUtil.deepMerge(defaults, overrides)
ObjectUtil.pick(user, ['name', 'email'])
ObjectUtil.omit(user, ['password'])
ObjectUtil.flattenObject({ a: { b: 1 } })  // { 'a.b': 1 }
ObjectUtil.unflattenObject({ 'a.b': 1 })   // { a: { b: 1 } }
ObjectUtil.getPath(obj, 'user.address.city')
ObjectUtil.setPath(obj, 'user.role', 'admin')
ObjectUtil.toQueryString({ page: 1, q: 'test' })  // 'page=1&q=test'
ObjectUtil.diff(objA, objB)               // changed keys
ObjectUtil.isEqual(a, b)                  // deep equality
```

### StringUtil

```typescript
StringUtil.camelCase('hello world')       // 'helloWorld'
StringUtil.pascalCase('hello world')      // 'HelloWorld'
StringUtil.snakeCase('helloWorld')        // 'hello_world'
StringUtil.kebabCase('Hello World')       // 'hello-world'
StringUtil.titleCase('hello world')       // 'Hello World'
StringUtil.toSlug('Hello World!')         // 'hello-world'
StringUtil.truncate('Long text...', 20)
StringUtil.mask('4111111111111111', 4)    // '************1111'
StringUtil.initials('Bilal Raza')         // 'BR'
StringUtil.escapeHtml('<script>')         // '&lt;script&gt;'
StringUtil.stripHtml('<p>Hello</p>')      // 'Hello'
StringUtil.randomString(16)
StringUtil.isPalindrome('racecar')        // true
```

### StorageUtil

```typescript
// localStorage
StorageUtil.setLocal('user', { id: 1, name: 'Bilal' });
StorageUtil.getLocal<User>('user');
StorageUtil.removeLocal('user');

// sessionStorage
StorageUtil.setSession('draft', formData);
StorageUtil.getSession<Draft>('draft');

// Cookies
StorageUtil.setCookie('lang', 'en', 30);   // expires in 30 days
StorageUtil.getCookie('lang');
StorageUtil.removeCookie('lang');
```

### ValidationUtil

```typescript
ValidationUtil.isEmail('user@example.com')       // true
ValidationUtil.isUrl('https://example.com')       // true
ValidationUtil.isPhone('+1-800-555-0100')
ValidationUtil.isCreditCard('4111111111111111')   // Luhn check
ValidationUtil.isIPv4('192.168.1.1')
ValidationUtil.isStrongPassword('P@ssw0rd!', {
  minLength: 8,
  requireUppercase: true,
  requireSpecial: true,
})
ValidationUtil.passwordStrength('P@ssw0rd!')     // 0–5 score
ValidationUtil.isJSON('{"key":"val"}')
ValidationUtil.isHexColor('#ff5500')
ValidationUtil.matchesPattern(value, /^\d{4}$/)
```

---

## Module Import

```typescript
// app.module.ts  (or standalone app)
import { FormStructureModule, OslSkeletonModule } from 'osl-base-extended';

@NgModule({
  imports: [
    FormStructureModule,
    OslSkeletonModule,
  ]
})
export class AppModule {}
```

---

## Interfaces Reference

```typescript
// HTTP
interface HttpResponse<T> {
  isSuccessful: boolean;
  statusCode: number;
  error: string;
  result: T;
  headers?: HttpHeaders;
}

interface myParams {
  property: string;
  value: any;
}

// Grid
interface OslGridColumn {
  key: string;
  label: string;
  enums?: Record<any, string>;
  displayFn?: (row: any) => string;
  isActions?: boolean;
}

interface OslPageEvent  { page: number; pageSize: number; }
interface OslSortEvent  { key: string; direction: 'asc' | 'desc'; }

// Form
type InputType      = 'text' | 'password' | 'email' | 'number' | 'tel' | 'url';
type DateInputType  = 'date' | 'datetime-local' | 'time' | 'month' | 'week';
type TextareaResize = 'none' | 'both' | 'horizontal' | 'vertical';
type ButtonVariant  = 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info'
                    | 'outline-primary' | 'outline-secondary' | 'icon';
type ButtonSize     = 'sm' | 'md' | 'lg';
```

---

## License

ISC — © Bilal Raza
