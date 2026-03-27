import { Injectable, inject } from '@angular/core';
import { AuthService, User } from '@core/authentication';
import { NgxPermissionsService, NgxRolesService } from 'ngx-permissions';
import { catchError, of, switchMap, tap } from 'rxjs';
import { Menu, MenuService } from './menu.service';

@Injectable({
  providedIn: 'root',
})
export class StartupService {
  private readonly authService = inject(AuthService);
  private readonly menuService = inject(MenuService);
  private readonly permissonsService = inject(NgxPermissionsService);
  private readonly rolesService = inject(NgxRolesService);

  /**
   * Load the application only after get the menu or other essential informations
   * such as permissions and roles.
   */
  load() {
  return new Promise<void>((resolve) => {
    this.authService.checkIsInitialized().pipe(
      tap(result => this.authService.setInitialized(result.result)),
      switchMap(result => {
        if (!result.result) {
          return this.authService.change().pipe(
            tap(user => this.setPermissions(user)),
            switchMap(() => this.authService.menu()),
            tap(menu => this.setMenu(menu.body.menu))
          );
        }
        return of(null); // Skip auth load if not initialized
      }),
      catchError(() => {
        resolve();
        return of(null);
      })
    ).subscribe(() => resolve());
  });
}

  private setMenu(menu: Menu[]) {
    this.menuService.addNamespace(menu, 'menu');
    this.menuService.set(menu);
  }

  private setPermissions(user: User) {
    const roleConfig: Record<string, string[]> = {
      Admin: [
        'employees:canRead',
        'employees:canAdd',
        'employees:canEdit',
        'employees:canDelete',
        'departments:canRead',
        'departments:canAdd',
        'departments:canEdit',
        'departments:canDelete',
        'tasks:canRead',
        'tasks:canAdd',
        'tasks:canEdit',
        'tasks:canDelete',
      ],
      Manager: [
        'employees:canRead',
        'departments:canRead',
        'tasks:canRead',
        'tasks:canAdd',
        'tasks:canEdit',
        'tasks:canDelete',
      ],
      Employee: ['employees:canRead', 'tasks:canRead'],
    };

    const roleName = user.CompanyRole || 'Employee';
    const permissions = roleConfig[roleName] || roleConfig['Employee'];

    this.permissonsService.loadPermissions(permissions);

    this.rolesService.flushRoles();
    this.rolesService.addRoles({
      [roleName]: permissions,
    });
  }
}
