import { Injectable, inject, signal } from '@angular/core';
import { BehaviorSubject, iif, map, Observable, of, share, switchMap, tap } from 'rxjs';
import { isEmptyObject } from './helpers';
import { User } from './interface';
import { LoginService } from './login.service';
import { TokenService } from './token.service';
import { RequestInfo } from 'angular-in-memory-web-api';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly loginService = inject(LoginService);
  private readonly tokenService = inject(TokenService);

  private readonly _isFirstUser = signal<boolean>(true);
  readonly isFirstUser = this._isFirstUser.asReadonly();

  setInitialized(value: boolean) {
    this._isFirstUser.set(value);
  }

  private user$ = new BehaviorSubject<User>({});

  private change$ = this.tokenService.change().pipe(
    switchMap(() => this.assignUser()),
    share()
  );

  init() {
    return new Promise<void>(resolve => this.change$.subscribe(() => resolve()));
  }

  change() {
    return this.change$;
  }

  check() {
    return this.tokenService.valid();
  }

  login(email: string, password: string) {
    return this.loginService.login(email, password).pipe(
      tap(apiResponse => this.tokenService.set(apiResponse.result)),
      map(() => this.check())
    );
  }

  logout() {
    return this.loginService.logout().pipe(
      tap(() => this.tokenService.clear()),
      map(() => !this.check())
    );
  }

  user() {
    return this.user$.pipe(share());
  }

  menu() {
    return iif(() => this.check(), this.loginService.menu(), of({ body: { menu: [] } }));
  }

  checkIsInitialized() {
      return this.loginService.isInitialized().pipe(
        tap(result => {
          // Update our signal state so guards can access it synchronously
          this._isFirstUser.set(result.result);
        })
      );
    }

  private assignUser(): Observable<any> {
    if (!this.check()) {
      const emptyUser = {};
      this.user$.next(emptyUser);
      return of(emptyUser);
    }

    // Always decode the fresh token when this runs
    const token = this.tokenService.getBearerToken();
    if (!token) return of({});

    const cleanToken = token.replace('Bearer ', '').trim();
    const userData = this.decodeToken(cleanToken);

    if (userData) {
      this.user$.next(userData);
      return of(userData);
    }

    return of({});
  }

  private decodeToken(token: string): User | null {
    try {
      // A JWT has 3 parts separated by dots: Header.Payload.Signature
      // We want the middle part (index 1)
      const payload = token.split('.')[1];
      const decodedJson = atob(payload); // Standard Base64 decoding
      return JSON.parse(decodedJson) as User;
    } catch (e) {
      console.error('Failed to decode JWT', e);
      return null;
    }
  }
}
