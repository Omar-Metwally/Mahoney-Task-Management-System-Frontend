import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map, Observable, switchMap, tap } from 'rxjs';
import { RequestInfo, STATUS } from 'angular-in-memory-web-api';
import { Menu, USE_REAL_API } from '@core';
import { Token, User } from './interface';
import { ApiResponse } from '@shared/interfaces/ApiResponse';
import { ajax } from 'rxjs/ajax';

@Injectable({
  providedIn: 'root',
})
export class LoginService {
  protected readonly http = inject(HttpClient);

  private realApi() {
    return { context: new HttpContext().set(USE_REAL_API, true) };
  }

  login(email: string, password: string) {
    return this.http.post<ApiResponse<string>>(
      '/auth/login',
      { email, password },
      this.realApi()
    );
  }

  firstUserSignup(firstName: string, lastName: string, username: string, email: string, password: string ){
    return this.http.post<ApiResponse<string>>('/auth/firstUserSignup', {
      firstName, lastName, username, email, password
    }, this.realApi());
  }

  isInitialized() {
    return this.http.get<ApiResponse<boolean>>('/auth/isFirstUser', this.realApi());
  }

  logout() {
    return this.http.post<any>('/auth/logout', {}, this.realApi());
  }

  refresh(params: Record<string, any>) {
    return this.http.post<Token>('/auth/refresh', params);
  }

  user() {
    return this.http.get<User>('/user');
  }

  menu(): Observable<any> {
    return ajax('data/menu.json?_t=' + Date.now()).pipe(

      map((response: any): any => {
        const mappedResult = {
          body: {
            menu: response.response?.menu
          },
        };
        return mappedResult;
      }),
    );
  }
}
