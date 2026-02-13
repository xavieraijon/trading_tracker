import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

const STORAGE_KEY = 'app-theme';

function applyInitialTheme(): void {
  const stored = localStorage.getItem(STORAGE_KEY);
  const root = document.documentElement;
  if (stored === 'light') {
    root.classList.remove('dark');
  } else if (stored === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.toggle('dark', window.matchMedia('(prefers-color-scheme: dark)').matches);
  }
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (localStorage.getItem(STORAGE_KEY) !== 'light' && localStorage.getItem(STORAGE_KEY) !== 'dark') {
      root.classList.toggle('dark', e.matches);
    }
  });
}

applyInitialTheme();
bootstrapApplication(App, appConfig).catch((err) => console.error(err));
