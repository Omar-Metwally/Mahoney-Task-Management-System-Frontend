import { Routes } from '@angular/router';
import { authGuard } from '@core';
import { AdminLayout } from '@theme/admin-layout/admin-layout';
import { AuthLayout } from '@theme/auth-layout/auth-layout';
import { Error403 } from './routes/sessions/error-403';
import { Error404 } from './routes/sessions/error-404';
import { Error500 } from './routes/sessions/error-500';
import { Login } from './routes/sessions/login/login';
import { Register } from './routes/sessions/register/register';
import { rootUserGuard } from '@core/authentication/root-user-guard';
import { guestGuard } from '@core/authentication/guest-guard';

export const routes: Routes = [
  {
    path: '',
    component: AdminLayout,
    canActivate: [authGuard],
    canActivateChild: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: '403', component: Error403 },
      { path: '404', component: Error404 },
      { path: '500', component: Error500 },
      {
        path: 'employees',
        loadChildren: () => import('./routes/employees/employees.routes').then(m => m.routes),
      },
      {
        path: 'departments',
        loadChildren: () => import('./routes/departments/departments.routes').then(m => m.routes),
      },
      {
        path: 'company-tasks',
        loadChildren: () => import('./routes/company-tasks/company-tasks.routes').then(m => m.routes),
      },
    ],
  },
  {
    path: 'auth',
    component: AuthLayout,
    canActivate: [guestGuard],
    children: [
      { path: 'login', component: Login },
      {
        path: 'signup',
        component: Register,
        canActivate: [rootUserGuard]
      },
    ],
  },
  { path: '**', redirectTo: 'company-tasks' },
];
