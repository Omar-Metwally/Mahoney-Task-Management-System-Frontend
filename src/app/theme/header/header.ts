import { Component, ViewEncapsulation, inject, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import screenfull from 'screenfull';

import { Branding } from '../widgets/branding';
import { GithubButton } from '../widgets/github-button';
import { NotificationButton } from '../widgets/notification-button';
import { TranslateButton } from '../widgets/translate-button';
import { UserButton } from '../widgets/user-button';
import { ThemeToggleComponent } from '@theme/widgets/light.button';
import { AuthService } from '@core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-header',
  templateUrl: './header.html',
  styleUrl: './header.scss',
  host: {
    class: 'matero-header',
  },
  encapsulation: ViewEncapsulation.None,
  imports: [
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    Branding,
    ThemeToggleComponent
  ],
})
export class Header {
  readonly showToggle = input(true);
  readonly showBranding = input(false);

  readonly toggleSidenav = output<void>();
  readonly toggleSidenavNotice = output<void>();

  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  toggleFullscreen() {
    if (screenfull.isEnabled) {
      screenfull.toggle();
    }
  }

logout() {
    this.authService.logout().subscribe({
      next: (isLoggedOut) => {
        if (isLoggedOut) {
          // Navigate to login page after successful logout
          this.router.navigateByUrl('/auth/login');
        }
      },
      error: (err) => {
        console.error('Logout failed', err);
      }
    });
  }
}
