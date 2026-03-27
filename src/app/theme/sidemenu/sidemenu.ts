import { AsyncPipe, NgTemplateOutlet, SlicePipe } from '@angular/common';
import { Component, ViewEncapsulation, computed, effect, inject } from '@angular/core';
import { MatRippleModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { NgxPermissionsModule, NgxPermissionsService } from 'ngx-permissions';

import { MenuService } from '@core';
import { NavAccordion } from './nav-accordion';
import { NavAccordionItem } from './nav-accordion-item';
import { NavAccordionToggle } from './nav-accordion-toggle';
import { toSignal } from '@angular/core/rxjs-interop';
import { interval } from 'rxjs';

@Component({
  selector: 'app-sidemenu',
  templateUrl: './sidemenu.html',
  styleUrl: './sidemenu.scss',
  encapsulation: ViewEncapsulation.None,
  imports: [
    SlicePipe,
    NgTemplateOutlet,
    RouterLink,
    RouterLinkActive,
    NgxPermissionsModule,
    MatIconModule,
    MatRippleModule,
    TranslateModule,
    NavAccordion,
    NavAccordionItem,
    NavAccordionToggle,
  ],
})
export class Sidemenu {

  readonly menuService = inject(MenuService);
  private readonly permissionsService = inject(NgxPermissionsService);

  // 1. Convert the Menu Observable to a Signal
  private menuItems = toSignal(this.menuService.getAll(), { initialValue: [] });

  // 2. Convert Permission changes to a Signal
  private permissions = toSignal(this.permissionsService.permissions$, { initialValue: {} });

  // 3. Create a computed signal that refreshes whenever either changes
  // This ensures that when permissions are loaded, the menu re-evaluates
  readonly finalMenu = computed(() => {
    this.permissions(); // Just accessing it creates the dependency
    return this.menuItems();
  });
}
