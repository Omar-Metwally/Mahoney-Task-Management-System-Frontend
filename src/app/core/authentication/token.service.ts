import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, share } from 'rxjs';
import { LocalStorageService } from '@shared';

@Injectable({ providedIn: 'root' })
export class TokenService {
  private readonly key = 'app-auth-token';
  private readonly store = inject(LocalStorageService);

  // We store the actual token string (or undefined) so AuthService can react to it
  private readonly change$ = new BehaviorSubject<string | undefined>(this.store.get(this.key));

  /**
   * Returns an observable that emits whenever the token changes.
   * Used by AuthService to trigger user profile loading.
   */
  change() {
    return this.change$.asObservable().pipe(share());
  }

  /**
   * Used by AuthService.check() to see if we have a session.
   */
  valid(): boolean {
    const token = this.store.get(this.key);

    // 1. Explicit check for null, undefined, or empty string
    if (token === null || token === undefined || token === '') {
      return false;
    }

    // 2. Check if the JWT itself has expired
    return !this.isTokenExpired(token);
  }

  private isTokenExpired(token: string): boolean {
    try {
      // Split the JWT to get the payload (index 1)
      const parts = token.split('.');
      if (parts.length !== 3) {
        return true; // Not a valid JWT format
      }

      // Decode Base64 string to JSON
      // atob() decodes the base64 string
      const payload = JSON.parse(atob(parts[1]));

      // JWT 'exp' is in seconds, JavaScript Date is in milliseconds
      if (!payload.exp) {
        return false; // If no expiration date is set, assume it's valid
      }

      const expirationTime = payload.exp * 1000;
      const currentTime = Date.now();

      // If current time is greater than expiration, it's expired
      return currentTime >= expirationTime;
    } catch (error) {
      // If decoding fails (malformed token), treat as expired/invalid
      return true;
    }
  }

  set(token: any) {
    const tokenStr = typeof token === 'string' ? token : token?.access_token;
    this.store.set(this.key, tokenStr);
    this.change$.next(tokenStr);
    return this;
  }

  clear() {
    this.store.remove(this.key);
    this.change$.next(undefined);
  }

  getBearerToken() {
    const token = this.store.get(this.key);
    return token ? `Bearer ${token}` : '';
  }
}
