import { ApplicationConfig, inject, Injector, provideAppInitializer, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter, RouteReuseStrategy } from '@angular/router';

import { routes } from './app.routes';
import { AppInjector } from './app-injector';
import { provideHttpClient } from '@angular/common/http';
import { CustomReuseStrategy } from './router-stragety';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideHttpClient(),
    provideAppInitializer(() => {
      const injector = inject(Injector);
      AppInjector.setInjector(injector);
    }),
    // { provide: RouteReuseStrategy, useClass: CustomReuseStrategy }
  ]
};
