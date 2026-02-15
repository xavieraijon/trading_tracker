import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { appRoutes } from './app.routes';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { providePrimeNG } from 'primeng/config';
import { BullishBananaPreset } from './core/theme/bullish-banana-preset';
import { authInterceptor } from './core/auth/auth.interceptor';

import { registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';
import localeEn from '@angular/common/locales/en';
import { LOCALE_ID } from '@angular/core';

registerLocaleData(localeEs, 'es-ES');
registerLocaleData(localeEn, 'en-US');

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(appRoutes),
    provideAnimationsAsync(),
    provideHttpClient(withInterceptors([authInterceptor])),
    providePrimeNG({
        theme: {
            preset: BullishBananaPreset,
            options: {
                darkModeSelector: '.dark',
                cssLayer: {
                    name: 'primeng',
                    order: 'reset, theme, base, primeng, layout, components, utilities',
                },
            },
        },
    }),
    { provide: LOCALE_ID, useValue: 'es-ES' }
  ],
};
