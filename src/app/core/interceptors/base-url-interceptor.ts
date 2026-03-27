import { HttpContextToken, HttpHandlerFn, HttpRequest } from '@angular/common/http';
import { InjectionToken, inject } from '@angular/core';

export const BASE_URL = new InjectionToken<string>('BASE_URL');
export const USE_REAL_API = new HttpContextToken<boolean>(() => false);

export function hasHttpScheme(url: string) {
  return new RegExp('^http(s)?://', 'i').test(url);
}

export function baseUrlInterceptor(req: HttpRequest<unknown>, next: HttpHandlerFn) {
  const baseUrl = inject(BASE_URL, { optional: true });

  // 1. Check if the "USE_REAL_API" tag is set to true
  const isRealApi = req.context.get(USE_REAL_API);

  // 2. If it's a real API call and we have a baseUrl, prepend it
  if (isRealApi && baseUrl && !hasHttpScheme(req.url)) {
    const newUrl = [baseUrl.replace(/\/$/g, ''), req.url.replace(/^\.?\//, '')]
                   .filter(val => val).join('/');

    return next(req.clone({ url: newUrl }));
  }

  // 3. Otherwise, just pass it through (it will hit your In-Memory Web API)
  return next(req);
}
