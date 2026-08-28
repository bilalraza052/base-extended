import { InjectionToken, Type } from '@angular/core';

export const AUTOCOMPLETE_LISTER_COMPONENT = new InjectionToken<Type<any>>('AUTOCOMPLETE_LISTER_COMPONENT');

export interface oslListerData {
  title: string;
  methodName: string;
  service: any;
  configMethodName: string;
  apiBody:any;
  /** When true, the lister shows row checkboxes and lets the user pick multiple rows. */
  multiple?: boolean;
  /** Row property used as the unique key for checkbox selection state. */
  valueField?: string;
  /** Rows already selected before the dialog opened (seeds the checkbox state). */
  selected?: any[];
}
