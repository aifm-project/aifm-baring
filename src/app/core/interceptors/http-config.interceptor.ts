// src/app/core/interceptors/http-config.interceptor.ts
import {
  HttpEvent,
  HttpRequest,
  HttpHandlerFn,
  HttpResponse,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import * as Crypto from 'crypto-js';
import { environment } from '../../../environments/environment';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export function httpConfigInterceptor(
  request: HttpRequest<any>,
  next: HttpHandlerFn
): Observable<HttpEvent<any>> {
  const authService = inject(AuthService);
  const enableEncryption = request.headers.get('enable-encryption');
  let tokenSet = false;
  if (request.headers.get('x-access-token')) {
    tokenSet = true;
  }
  let req = request;
  if (!tokenSet) {
    const token = localStorage.getItem('authToken');
    if (token) {
      req = req.clone({
        setHeaders: {
          'x-access-token': token
        }
      });
    }
  }
  if (enableEncryption === 'true' && environment.genericAlpha) {
    let encryptedMessage = Crypto.AES.encrypt(
      JSON.stringify(req.body),
      environment.genericAlpha
    ).toString();
    const body = { encryptedMessage };
    req = req.clone({ body });
  }
  return next(req).pipe(
    map((event: HttpEvent<any>) => {
      if (event instanceof HttpResponse) {
        // Optionally handle/decrypt successful responses here
      }
      return event;
    }),
    catchError((error: HttpErrorResponse) => {
      if (error.status === 200 && error.error && error.error.text && environment.genericAlpha) {
        let bytes = Crypto.AES.decrypt(
          error.error.text,
          environment.genericAlpha
        );
        return of(
          new HttpResponse({
            status: 200,
            body: JSON.parse(bytes.toString(Crypto.enc.Utf8)),
          })
        );
      } else if (error.status == 401) {
        authService.logout();
      }
      return throwError(() => error);
    })
  );
}