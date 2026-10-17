import { Component, TemplateRef, ViewChild } from '@angular/core';
import { FormStructureModule, baseComponent, elements } from 'sh-base-extended';
import { OWNERS } from './data';

@Component({
  selector: 'demo-dialogs',
  imports: [FormStructureModule],
  template: `
  <div class="card">
    <h1>Dialogs, panels, menus &amp; toasts</h1>
    <p class="sub">baseComponent helpers rendered with HubSpot modal / side-panel styling.</p>
    <div class="row-btns">
      <sh-button label="Open side panel" (clickEv)="panel()"></sh-button>
      <sh-button label="Open modal" variant="secondary" (clickEv)="modal()"></sh-button>
      <sh-button label="Delete dialog" variant="danger" (clickEv)="del()"></sh-button>
      <sh-button label="Warning dialog" variant="secondary" (clickEv)="warn()"></sh-button>
      <sh-button label="Validation errors" variant="secondary" (clickEv)="errors()"></sh-button>
      <sh-button label="Success toast" variant="transparent" (clickEv)="showSuccess('Contact created')"></sh-button>
      <sh-button label="Error toast" variant="transparent" (clickEv)="showError('Something went wrong')"></sh-button>
      <button type="button" class="menu-trigger" [shMenuTriggerFor]="menu">Actions <span class="caret"></span></button>
      <sh-menu #menu position="below">
        <button class="sh-menu-item" sh-menu-item (click)="showInfo('Data quality')">Data quality</button>
        <button class="sh-menu-item" sh-menu-item (click)="showInfo('Edit properties')">Edit properties</button>
        <button class="sh-menu-item" sh-menu-item (click)="showInfo('Restore records')">Restore records</button>
      </sh-menu>
    </div>
  </div>

  <ng-template #body>
    <sh-dynamic-form [elements]="form" [(model)]="model"></sh-dynamic-form>
  </ng-template>
  <ng-template #footer let-d>
    <div class="row-btns">
      <sh-button label="Create" (clickEv)="d.dialogRef.close(); showSuccess('Deal created')"></sh-button>
      <sh-button label="Cancel" variant="secondary" (clickEv)="d.dialogRef.close()"></sh-button>
    </div>
  </ng-template>
  `,
  styles: `
  .card { background: #fff; border-radius: 16px; padding: 24px 32px 32px; }
  h1 { margin: 0; font-size: 20px; font-weight: 500; }
  .sub { margin: 4px 0 24px; color: #666; }
  .row-btns { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; }
  .menu-trigger { height: 40px; padding: 0 20px; border-radius: 999px; border: 1px solid #8a8a8a; background: #fff; font: 600 14px/18px "Lexend Deca", sans-serif; color: #333; cursor: pointer; display: inline-flex; align-items: center; gap: 8px; }
  .caret { border-top: 4px solid #333; border-left: 4px solid transparent; border-right: 4px solid transparent; }
  `,
})
export class DialogsPage extends baseComponent {
  @ViewChild('body') body!: TemplateRef<any>;
  @ViewChild('footer') footer!: TemplateRef<any>;
  model: any = {};
  form: elements[] = [
    { key: 'dealName', label: 'Deal name', elementType: 'textbox', columns: 12, required: true },
    { key: 'pipeline', label: 'Pipeline', elementType: 'select', columns: 6, datasource: [{ id: 1, n: 'Sales Pipeline' }], displayField: 'n', valueField: 'id' },
    { key: 'stage', label: 'Deal stage', elementType: 'select', columns: 6, datasource: [{ id: 1, n: 'Appointment scheduled' }, { id: 2, n: 'Qualified to buy' }, { id: 3, n: 'Closed won' }], displayField: 'n', valueField: 'id' },
    { key: 'amount', label: 'Amount', elementType: 'textbox', columns: 6, decimalPortion: 2 },
    { key: 'closeDate', label: 'Close date', elementType: 'datepicker', columns: 6 },
    { key: 'owner', label: 'Deal owner', elementType: 'select', columns: 12, datasource: OWNERS, displayField: 'name', valueField: 'id', descriptionField: 'email' },
  ];

  panel() { this.model = {}; this.openSidePanel('Create Deal', this.body, this.footer); }
  modal() { this.model = {}; this.openDialog('Create deal', this.body, this.footer, '640px'); }
  del() { this.openDeleteDialog("You're about to delete 1 record. Deleted records can't be restored after 90 days.", 'Delete 1 record?'); }
  warn() { this.openWarningDialog('Discard changes?', 'Your changes to this view have not been saved.', () => this.showSuccess('Discarded'), undefined, 'Discard', 'Keep editing'); }
  errors() { this.showError(['Email is required', 'First name is required', 'Phone number is invalid', 'Lifecycle stage is required', 'Close date cannot be in the past'], 'Fix these fields'); }
  override showInfo(m: string) { super.showInfo(m); }
  override showSuccess(m: any) { super.showSuccess(m); }
  override showError(e: any, t?: string) { super.showError(e, t); }
}
