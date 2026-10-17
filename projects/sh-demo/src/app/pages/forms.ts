import { Component } from '@angular/core';
import { JsonPipe } from '@angular/common';
import { FormStructureModule, baseComponent, elements } from 'sh-base-extended';
import { CITIES, LIFECYCLE, OWNERS } from './data';

@Component({
  selector: 'demo-forms',
  imports: [FormStructureModule, JsonPipe],
  template: `
  <div class="card">
    <h1>Form fields</h1>
    <p class="sub">Every sh-* control, styled like HubSpot.</p>

    <div class="grid">
      <sh-input label="Email" type="email" [required]="true" placeholder="" [(model)]="m.email"></sh-input>
      <sh-input label="First name" [(model)]="m.first"></sh-input>
      <sh-input label="Disabled" [disabled]="true" model="Read only value"></sh-input>
      <sh-input label="Amount" [decimalPortion]="2" prefixIcon="attach_money" [(model)]="m.amount"></sh-input>

      <sh-select label="Contact owner" [datasource]="owners" displayField="name" valueField="id" descriptionField="email" [clearable]="true" [(model)]="m.owner"></sh-select>
      <sh-select label="Lifecycle stage" [datasource]="lifecycle" displayField="name" valueField="id" [required]="true" [(model)]="m.stage"></sh-select>
      <sh-select label="Tags (multiple)" [datasource]="lifecycle" displayField="name" valueField="id" [multiple]="true" [showSelectAll]="true" [(model)]="m.tags"></sh-select>
      <sh-select label="Loading" [loading]="true"></sh-select>

      <sh-autocomplete label="City" [datasource]="cities" displayField="name" valueField="id" searchType="Local" [(model)]="m.city"></sh-autocomplete>
      <sh-autocomplete label="Cities (chips)" autocompleteType="chips" [datasource]="cities" displayField="name" valueField="id" searchType="Local" [(model)]="m.cities"></sh-autocomplete>
      <sh-datepicker label="Close date" [clearable]="true" [(model)]="m.date"></sh-datepicker>
      <sh-datetimepicker label="Meeting time" [(model)]="m.dt"></sh-datetimepicker>

      <sh-chips-input label="CC emails" inputType="email" [(model)]="m.cc"></sh-chips-input>
      <sh-file-upload label="Attachment" [(model)]="m.file"></sh-file-upload>
      <sh-textarea label="Notes" [rows]="3" [maxLength]="200" [characterCounter]="true" [(model)]="m.notes"></sh-textarea>
      <div class="stack">
        <sh-checkbox label="Send welcome email" [(model)]="m.welcome"></sh-checkbox>
        <sh-slide-toggle label="Marketing contact" trueLabel="On" falseLabel="Off" [(model)]="m.marketing"></sh-slide-toggle>
        <sh-radio label="Priority" [datasource]="['Low','Medium','High']" [inline]="true" [(model)]="m.priority"></sh-radio>
      </div>
    </div>

    <h2>Buttons</h2>
    <div class="row-btns">
      <sh-button label="Create" variant="primary"></sh-button>
      <sh-button label="Cancel" variant="secondary"></sh-button>
      <sh-button label="Add contacts" variant="primary" [caret]="true"></sh-button>
      <sh-button label="Delete" variant="danger"></sh-button>
      <sh-button label="Saving" variant="primary" [loading]="true"></sh-button>
      <sh-button label="Disabled" variant="primary" [disabled]="true"></sh-button>
      <sh-button label="Export" variant="secondary" size="sm" icon="ios_share" iconPosition="before"></sh-button>
      <sh-button label="Clear all" variant="transparent"></sh-button>
      <sh-button label="Edit this form" variant="link"></sh-button>
      <sh-button variant="icon" icon="more_vert" size="sm" tooltip="More"></sh-button>
    </div>

    <h2>Document uploader &amp; record log</h2>
    <div class="grid2">
      <sh-document-uploader label="Documents" [multiple]="true" [showUploadButton]="true"
        [savedDocuments]="docs"></sh-document-uploader>
      <sh-user-log [meta]="log"></sh-user-log>
    </div>

    <h2>Dynamic form</h2>
    <sh-dynamic-form [elements]="elements" [(model)]="dm"></sh-dynamic-form>
    <pre>{{ dm | json }}</pre>
  </div>
  `,
  styles: `
  .card { background: #fff; border-radius: 16px; padding: 24px 32px 32px; }
  h1 { margin: 0; font-size: 20px; font-weight: 500; }
  h2 { margin: 32px 0 16px; font-size: 16px; font-weight: 600; }
  .sub { margin: 4px 0 24px; color: #666; }
  .grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 24px 24px; align-items: start; }
  .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; align-items: start; }
  .stack { display: flex; flex-direction: column; gap: 16px; }
  .row-btns { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; }
  pre { background: #f5f5f5; border-radius: 6px; padding: 12px; font-size: 12px; }
  `,
})
export class FormsPage extends baseComponent {
  owners = OWNERS; lifecycle = LIFECYCLE; cities = CITIES;
  m: any = { tags: [], cities: [], cc: [] };
  dm: any = {};
  log = { addLog: 'Bilal Raza', addOn: '2026-05-28T09:15:00', editLog: 'Sara Khan', editOn: new Date() };
  docs: any[] = [
    { id: 1, name: 'Invoice_INV-2049.pdf', addBy: 'Bilal Raza', addOn: '2026-10-01T10:00:00' },
    { id: 2, name: 'Contract.docx', addBy: 'Sara Khan', addOn: '2026-10-05T14:30:00' },
  ];
  elements: elements[] = [
    { key: 'company', label: 'Company name', elementType: 'textbox', columns: 6, required: true },
    { key: 'domain', label: 'Company domain name', elementType: 'textbox', columns: 6 },
    { key: 'owner', label: 'Company owner', elementType: 'select', columns: 6, datasource: OWNERS, displayField: 'name', valueField: 'id', descriptionField: 'email' },
    { key: 'industry', label: 'Industry', elementType: 'select', columns: 6, datasource: [{ id: 1, n: 'Software' }, { id: 2, n: 'Finance' }, { id: 3, n: 'Retail' }], displayField: 'n', valueField: 'id', selectMultiple: true, showSelectAll: true },
    { key: 'address', label: 'Address', elementType: 'fieldset', columns: 12, rows: [
      { key: 'city', label: 'City', elementType: 'textbox', columns: 6 },
      { key: 'country', label: 'Country/Region', elementType: 'select', columns: 6, datasource: [{ c: 'PK', n: 'Pakistan' }, { c: 'KZ', n: 'Kazakhstan' }, { c: 'US', n: 'United States' }], displayField: 'n', valueField: 'c' },
    ] },
  ];
}
