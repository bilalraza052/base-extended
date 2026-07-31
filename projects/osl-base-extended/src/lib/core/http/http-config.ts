import { InjectionToken, Provider } from '@angular/core';

/**
 * Controls whether Httpbase attaches the caller's public IP (via ipify.org)
 * as the `ip-address` header on every outgoing request. Defaults to false
 * when not provided, so existing projects are unaffected until they opt in.
 */
export const OSL_ATTACH_CALLER_IP = new InjectionToken<boolean>('OSL_ATTACH_CALLER_IP');

/** Opt in from app.config.ts: providers: [provideCallerIpHeader()] */
export function provideCallerIpHeader(enabled: boolean = true): Provider {
  return { provide: OSL_ATTACH_CALLER_IP, useValue: enabled };
}
