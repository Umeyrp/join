import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';

import { routes } from './app.routes';

/**
 * Root application configuration, passed to `bootstrapApplication` in `main.ts`.
 * Registers the global providers available to the whole app (no NgModule needed).
 */
export const appConfig: ApplicationConfig = {
  providers: [
    // Reports uncaught errors/unhandled promise rejections to Angular's ErrorHandler
    // instead of only logging to the console.
    provideBrowserGlobalErrorListeners(),
    // Enables routing; withComponentInputBinding() maps route params directly to
    // component @Input()s (no manual ActivatedRoute subscription needed).
    provideRouter(routes, withComponentInputBinding()),
  ],
};
