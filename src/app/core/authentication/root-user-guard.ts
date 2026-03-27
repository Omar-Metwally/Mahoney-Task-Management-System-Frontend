import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '@core';

export const rootUserGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isFirstUser()) {
    return router.parseUrl('/auth/login');
  }

  return true;
};
