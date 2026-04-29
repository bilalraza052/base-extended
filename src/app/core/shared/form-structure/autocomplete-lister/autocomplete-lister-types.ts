import { InjectionToken, Type } from '@angular/core';

export const AUTOCOMPLETE_LISTER_COMPONENT = new InjectionToken<Type<any>>('AUTOCOMPLETE_LISTER_COMPONENT');

export interface oslListerData {
  title: string;
  methodName: string;
  service: any;
  configMethodName: string;
}
