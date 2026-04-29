import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class DatasourceCacheService {
  private cache = new Map<string, any[]>();
  private pending = new Map<string, Promise<any[]>>();

  private buildKey(service: any, methodName: string, body?: any): string {
    const serviceName = service?.constructor?.name ?? 'unknown';
    return `${serviceName}.${methodName}.${JSON.stringify(body ?? null)}`;
  }

  async load(service: any, methodName: string, body?: any): Promise<any[]> {
    const key = this.buildKey(service, methodName, body);

    if (this.cache.has(key)) {
      return this.cache.get(key)!;
    }

    if (this.pending.has(key)) {
      return this.pending.get(key)!;
    }

    const request = (async () => {
      try {
        const response = body !== undefined
          ? await service[methodName](body)
          : await service[methodName]();

        const data = Array.isArray(response) ? response : (response?.result ?? []);
        this.cache.set(key, data);
        return data;
      } finally {
        this.pending.delete(key);
      }
    })();

    this.pending.set(key, request);
    return request;
  }

  invalidate(service: any, methodName: string, body?: any): void {
    this.cache.delete(this.buildKey(service, methodName, body));
  }

  invalidateAll(): void {
    this.cache.clear();
  }
}
