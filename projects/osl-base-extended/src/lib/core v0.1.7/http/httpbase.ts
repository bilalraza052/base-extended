import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParams } from '@angular/common/http';
import { inject } from '@angular/core';
import { firstValueFrom, timeout } from 'rxjs';

export interface HttpResponse<T = any> {
  isSuccessful: boolean;
  statusCode: number;
  error: string;
  result: T;
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
  private getHeaders() {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: token ? `Bearer ${token}` : '',
    });
  }
  private handleSuccess<T>(statusCode: number, result: any): HttpResponse<T> {
    return {
      isSuccessful: statusCode >= 200 && statusCode < 300,
      error: '',
      result: result,
      statusCode: statusCode,
    };
  }

  private handleError<T>(error: any): HttpResponse<T> {
    return {
      isSuccessful: false,
      error: this.mapError(error),
      statusCode: error.status,
      result: null as any,
    };
  }

  private mapError(error: HttpErrorResponse): any {
    let errorMessage = '';
    switch (error.status) {
      case 0:
        errorMessage = 'Connection Error! Please Contact Adminsitration';
        break;
      case 400:
        errorMessage = error.error.message || 'Something Went Wrong';
        break;
      case 401:
        errorMessage = 'Unauthorized Access';
        break;
      case 403:
        errorMessage = "You don't have rights to perform this action";
        break;
      case 500:
        errorMessage = 'An error has occured,Please contact support';
        break;
      default:
        errorMessage = 'Something went wrong';
    }
    return errorMessage;
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

  private baseUrl = '/api/'; // Change later
  protected async post<T>(methodName: string, body: any): Promise<HttpResponse<T>> {
    try {
      const res = await firstValueFrom(
        this.http
          .post(this.getEndPoint(methodName), body, {
            observe: 'response',
            headers: this.getHeaders(),
          })
          .pipe(timeout(30000)),
      );
      return this.handleSuccess(res.status, res.body);
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

      return this.handleSuccess(res.status, res.body);
    } catch (error: any) {
      return this.handleError(error);
    }
  }
}
