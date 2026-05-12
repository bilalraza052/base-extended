import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParams } from '@angular/common/http';
import { inject } from '@angular/core';
import { firstValueFrom, timeout } from 'rxjs';

export interface HttpResponse<T = any> {
  isSuccessful: boolean;
  statusCode: number;
  error: string | any[];
  result: T;
  headers?: HttpHeaders;
}
export interface myParams {
  property: string;
  value: any;
}
export abstract class Httpbase {
  private controllerName: string = '';
  constructor(private controller: string) {
    this.controllerName = controller;
  }

  private getEndPoint(methodName: string) {
    return `${this.baseUrl}${this.controllerName}/${methodName}`;
  }

  // ─── Named shorthands ────────────────────────────────────────────────────────

  /** GET /controller/GetAll */
  async getAll<T>(): Promise<HttpResponse<T>> {
    return this.get<T>('GetAll');
  }

  /** GET /controller/GetById?id=<id> */
  async getById<T>(id: any): Promise<HttpResponse<T>> {
    return this.get<T>('GetById', [{ property: 'id', value: id }]);
  }

  /** POST /controller/Save */
  async save<T>(body: any): Promise<HttpResponse<T>> {
    return this.post<T>('Save', body);
  }

  /** PUT /controller/Update */
  async update<T>(body: any): Promise<HttpResponse<T>> {
    return this.put<T>('Update', body);
  }

  /** DELETE /controller/Delete?id=<id> */
  async remove<T>(id: any): Promise<HttpResponse<T>> {
    return this.delete<T>('Delete', [{ property: 'id', value: id }]);
  }

  /** POST /controller/Search */
  async search(body: any) {
    return this.post('Search', body);
  }

  /** GET /controller/getConfig */
  async getConfig() {
    return this.get('getConfig');
  }

  // ─── Internals ────────────────────────────────────────────────────────────────

  private getHeaders() {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: token ? `Bearer ${token}` : '',
    });
  }

  private getUploadHeaders() {
    const token = localStorage.getItem('token');
    // No Content-Type — browser sets multipart boundary automatically
    return new HttpHeaders({
      Authorization: token ? `Bearer ${token}` : '',
    });
  }

  private handleSuccess<T>(statusCode: number, result: any, header: any): HttpResponse<T> {
    return {
      isSuccessful: statusCode >= 200 && statusCode < 300,
      error: '',
      result: result,
      statusCode: statusCode,
      headers: header,
    };
  }

  private handleError<T>(error: any): HttpResponse<T> {
    if (error.status === 401) {
      
      window.location.href = '/login';
    }
    return {
      isSuccessful: false,
      error: this.mapError(error),
      statusCode: error.status,
      result:  null as any,
    };
  }
  flatObject(object:any){
    return Object.values(object)?.flat()?.map((x:any)=>x.toString());
  }

  private mapError(error: HttpErrorResponse): string | string[] {
    switch (error.status) {
      case 0:   return 'Connection Error! Please Contact Administration';
      case 400: return error.error?.errors? this.flatObject(error.error?.errors) :error.error?.message || 'Bad Request';
      case 401: return 'Unauthorized Access';
      case 403: return "You don't have rights to perform this action";
      case 404: return 'Resource not found';
      case 409: return error.error?.message || 'Conflict';
      case 422: return error.error?.message || 'Validation failed';
      case 500: return 'An error has occurred, Please contact support';
      default:  return 'Something went wrong';
    }
  }

  private buildParams(paramsArray: myParams[]): HttpParams {
    return (paramsArray || []).reduce((params, { property, value }) => {
      if (property && value != null) {
        return Array.isArray(value)
          ? value.reduce((p, v) => p.append(property, v), params)
          : params.set(property, value);
      }
      return params;
    }, new HttpParams());
  }

  protected http = inject(HttpClient);

  private baseUrl = '/api/';

  // ─── HTTP verb wrappers ───────────────────────────────────────────────────────

  protected async post<T>(methodName: string, body: any,params?:myParams[]): Promise<HttpResponse<T>> {
    try {
      const res = await firstValueFrom(
        this.http
          .post(this.getEndPoint(methodName), body, {
            observe: 'response',
            headers: this.getHeaders(),
            params: this.buildParams(params || []),
          })
          .pipe(timeout(30000)),
      );
      return this.handleSuccess(res.status, res.body, res.headers);
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  protected async get<T>(methodName: string, params?: myParams[]): Promise<HttpResponse<T>> {
    try {
      const res = await firstValueFrom(
        this.http
          .get(this.getEndPoint(methodName), {
            observe: 'response',
            headers: this.getHeaders(),
            params: this.buildParams(params || []),
          })
          .pipe(timeout(30000)),
      );
      return this.handleSuccess(res.status, res.body, res.headers);
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  protected async put<T>(methodName: string, body: any): Promise<HttpResponse<T>> {
    try {
      const res = await firstValueFrom(
        this.http
          .put(this.getEndPoint(methodName), body, {
            observe: 'response',
            headers: this.getHeaders(),
          })
          .pipe(timeout(30000)),
      );
      return this.handleSuccess(res.status, res.body, res.headers);
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  protected async patch<T>(methodName: string, body: any): Promise<HttpResponse<T>> {
    try {
      const res = await firstValueFrom(
        this.http
          .patch(this.getEndPoint(methodName), body, {
            observe: 'response',
            headers: this.getHeaders(),
          })
          .pipe(timeout(30000)),
      );
      return this.handleSuccess(res.status, res.body, res.headers);
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  protected async delete<T>(methodName: string, params?: myParams[]): Promise<HttpResponse<T>> {
    try {
      const res = await firstValueFrom(
        this.http
          .delete(this.getEndPoint(methodName), {
            observe: 'response',
            headers: this.getHeaders(),
            params: this.buildParams(params || []),
          })
          .pipe(timeout(30000)),
      );
      return this.handleSuccess(res.status, res.body, res.headers);
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  /** Multipart file upload — do NOT pass Content-Type; browser sets the boundary */
  protected async upload<T>(methodName: string, formData: FormData): Promise<HttpResponse<T>> {
    try {
      const res = await firstValueFrom(
        this.http
          .post(this.getEndPoint(methodName), formData, {
            observe: 'response',
            headers: this.getUploadHeaders(),
          })
          .pipe(timeout(60000)),
      );
      return this.handleSuccess(res.status, res.body, res.headers);
    } catch (error: any) {
      return this.handleError(error);
    }
  }
}
