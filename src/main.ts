import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

/**
 * Bootstraps the standalone root component with appConfig (see app.config.ts).
 *
 * window.onerror is patched to swallow a known noisy TypeError whose message
 * contains "startTime" before it reaches Angular's global error listener
 * (provideBrowserGlobalErrorListeners in app.config.ts). Every other error is
 * still forwarded to the original handler, so real errors aren't hidden.
 */
const originalOnError = window.onerror;
window.onerror = (message, source, lineno, colno, error) => {
    if (error instanceof TypeError && error.message.includes('startTime')) {
        return true;
    }
    return originalOnError ? originalOnError(message, source, lineno, colno, error) : false;
};

bootstrapApplication(App, appConfig).catch((err) => console.error(err));
