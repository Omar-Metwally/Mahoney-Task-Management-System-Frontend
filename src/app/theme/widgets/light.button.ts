import { Component, computed, inject, effect } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { SettingsService } from '@core';
import { startWith } from 'rxjs';
import { MatIconModule } from "@angular/material/icon";
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  template: `
    <button matIconButton (click)="toggle()">
      <mat-icon>brightness_high</mat-icon>
    </button>
  `,
  imports: [MatButtonModule, MatIconModule],
})
export class ThemeToggleComponent {
  private settings = inject(SettingsService);

  optionsSignal = toSignal(this.settings.notify.pipe(startWith(this.settings.options)));

  isDark = computed(() => this.settings.getThemeColor() === 'dark');

  constructor() {
    effect(() => {
      this.optionsSignal();

      const isDark = this.settings.getThemeColor();

      document.documentElement.classList.toggle('theme-dark', isDark === 'dark');
    });
  }

  toggle() {
    const next = this.settings.getThemeColor() === 'dark' ? 'light' : 'dark';
    this.settings.setTheme(next);
  }
}
