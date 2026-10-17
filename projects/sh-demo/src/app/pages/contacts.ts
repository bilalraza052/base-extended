import { Component } from '@angular/core';
import {
  baseComponent, FormStructureModule, ShGridColumn, ShMenuAction, ShBulkAction, elements,
} from 'sh-base-extended';
import { CITIES, LEAD_STATUS, LIFECYCLE, OWNERS, makeContacts } from './data';

@Component({
  selector: 'demo-contacts',
  imports: [FormStructureModule],
  template: `
    <sh-setup
      title="Contacts"
      recordLabel="contact"
      stateKey="demo-contacts"
      [columns]="columns"
      [datasource]="rows"
      [formElements]="form"
      [pageSize]="10"
      tableHeight="calc(100vh - 330px)"
      [moreMenuActions]="rowMenu"
      [moreMenuHeaderActions]="headerMenu"
      [checkboxSelection]="true"
      [selectedRowKeys]="selected"
      [bulkActions]="bulk"
      (rowCheckToggle)="onCheck($event)"
      (selectAllPageToggle)="onCheckPage($event)"
      (clearSelection)="selected = newSet()"
      (onSearch)="onSearch($event)"
      (onDelete)="onDelete($event)"
      [onSave]="onSave"
    ></sh-setup>
  `,
})
export class ContactsPage extends baseComponent {
  all = makeContacts(37);
  rows = [...this.all];
  selected = new Set<any>();

  columns: ShGridColumn[] = [
    { key: 'name', label: 'Name', displayType: 'link', click: (r) => this.showInfo(`Open ${r.name}`) },
    { key: 'email', label: 'Email', displayType: 'link' },
    { key: 'phone', label: 'Phone Number' },
    { key: 'leadStatus', label: 'Lead Status', enums: LEAD_STATUS },
    { key: 'company', label: 'Company' },
    { key: 'ownerId', label: 'Contact owner', displayFn: (v) => OWNERS.find(o => o.id === v)?.name ?? '--' },
    { key: 'createdOn', label: 'Create Date', displayType: 'date' },
    { key: 'subscribed', label: 'Subscribed', displayType: 'boolean' },
    { key: 'cityId', label: 'City', hidden: true, displayFn: (v) => CITIES.find(c => c.id === v)?.name ?? '--' },
  ];

  form: elements[] = [
    { key: 'email', label: 'Email', elementType: 'textbox', inputType: 'email', columns: 12, required: true },
    { key: 'firstName', label: 'First name', elementType: 'textbox', columns: 6 },
    { key: 'lastName', label: 'Last name', elementType: 'textbox', columns: 6 },
    { key: 'ownerId', label: 'Contact owner', elementType: 'select', columns: 12, datasource: OWNERS, displayField: 'name', valueField: 'id', descriptionField: 'email', clearable: true },
    { key: 'jobTitle', label: 'Job title', elementType: 'textbox', columns: 12 },
    { key: 'phone', label: 'Phone number', elementType: 'textbox', columns: 12, mask: '+0 (000) 000-0000' },
    { key: 'lifecycle', label: 'Lifecycle stage', elementType: 'select', columns: 6, datasource: LIFECYCLE, displayField: 'name', valueField: 'id' },
    { key: 'leadStatus', label: 'Lead status', elementType: 'select', columns: 6, datasource: LEAD_STATUS, displayField: 'label', valueField: 'value' },
    { key: 'cityId', label: 'City', elementType: 'autocomplete', columns: 12, datasource: CITIES, displayField: 'name', valueField: 'id', searchType: 'Local' } as any,
    { key: 'createdOn', label: 'Create date', elementType: 'datepicker', columns: 6 },
    { key: 'subscribed', label: 'Marketing subscription', elementType: 'slide-toggle', columns: 6, trueLabel: 'Subscribed', falseLabel: 'Not subscribed' } as any,
  ];

  rowMenu: ShMenuAction[] = [
    { label: 'Preview', click: (r) => this.showInfo(`Preview ${r.name}`) },
    { label: 'Send email', click: async (r) => { await new Promise(x => setTimeout(x, 800)); this.showSuccess(`Email sent to ${r.email}`); } },
  ];

  headerMenu: ShMenuAction[] = [
    { label: 'Import', click: () => this.showInfo('Import started') },
    { label: 'Edit properties', click: () => this.showInfo('Edit properties') },
  ];

  bulk: ShBulkAction[] = [
    { label: 'Assign', icon: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"><path d="M2 8h11M9 4l4 4-4 4"/></svg>', click: (rows) => this.showSuccess(`${rows.length} assigned`) },
    { label: 'Edit', icon: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"><path d="M10.8 2.6l2.6 2.6L5.6 13H3v-2.6z"/></svg>', click: (rows) => this.showInfo(`Edit ${rows.length}`) },
    { label: 'Delete', danger: true, icon: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 4h11M6 4V2.6h4V4M4 4l.7 9.4h6.6L12 4"/></svg>', click: (rows) => {
      this.openDeleteDialog(`You're about to delete ${rows.length} record(s). Deleted records can't be restored after 90 days.`, `Delete ${rows.length} record${rows.length === 1 ? '' : 's'}?`)
        .afterClosed().subscribe(ok => {
          if (!ok) return;
          const ids = new Set(rows.map(r => r.id));
          this.all = this.all.filter(r => !ids.has(r.id));
          this.rows = [...this.all];
          this.selected = new Set();
          this.showSuccess('Records deleted');
        });
    } },
  ];

  newSet() { return new Set<any>(); }

  onCheck(e: { row: any; checked: boolean }) {
    const s = new Set(this.selected);
    e.checked ? s.add(e.row.id) : s.delete(e.row.id);
    this.selected = s;
  }

  onCheckPage(e: { rows: any[]; checked: boolean }) {
    const s = new Set(this.selected);
    e.rows.forEach(r => e.checked ? s.add(r.id) : s.delete(r.id));
    this.selected = s;
  }

  onSearch(q: string) {
    const t = (q || '').toLowerCase();
    this.rows = t ? this.all.filter(r => (r.name + r.email + r.company).toLowerCase().includes(t)) : [...this.all];
  }

  onDelete(row: any) {
    this.all = this.all.filter(r => r.id !== row.id);
    this.rows = [...this.all];
    this.showSuccess('Contact deleted');
  }

  onSave = async (e: any) => {
    const errors = this.isValidBeforeSave(this.form, e.model);
    if (errors.length) { this.showError(errors); return false; }
    await new Promise(x => setTimeout(x, 600));
    if (e.mode === 'add') {
      const m = e.model;
      this.all = [{ ...m, id: Date.now(), name: `${m.firstName ?? ''} ${m.lastName ?? ''}`.trim() || m.email, createdOn: m.createdOn || new Date().toISOString() }, ...this.all];
    } else {
      this.all = this.all.map(r => r.id === e.model.id ? { ...r, ...e.model } : r);
    }
    this.rows = [...this.all];
    this.showSuccess(e.mode === 'add' ? 'Contact created' : 'Contact updated');
    return true;
  };
}
