import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

// Sync OS dark-mode preference → .dark on <html> (activa PrimeNG + custom tokens)
const mq = window.matchMedia('(prefers-color-scheme: dark)');
document.documentElement.classList.toggle('dark', mq.matches);
mq.addEventListener('change', (e) => document.documentElement.classList.toggle('dark', e.matches));

bootstrapApplication(App, appConfig).catch((err) => console.error(err));
