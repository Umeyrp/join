import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

const originalOnError = window.onerror;
window.onerror = (message, source, lineno, colno, error) => {
    if (error instanceof TypeError && error.message.includes('startTime')) {
        return true;
    }
    return originalOnError ? originalOnError(message, source, lineno, colno, error) : false;
};

bootstrapApplication(App, appConfig).catch((err) => console.error(err));
