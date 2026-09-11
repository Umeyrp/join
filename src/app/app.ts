import { Component, signal } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';

@Component({
    selector: 'app-root',
    imports: [RouterOutlet],
    templateUrl: './app.html',
    styleUrl: './app.scss',
})
/**
 * Root component, bootstrapped in main.ts. Hosts the <router-outlet> and tracks
 * navigation so a redirect to /login doesn't lose the user's last page.
 *
 * On every completed navigation (except to /login) the target URL is saved to
 * sessionStorage under 'lastUrl'. auth.guard.ts reads it back (falling back to
 * /summary) to return the user to where they were before getting kicked out.
 */
export class App {
    protected readonly title = signal('join');

    constructor(private router: Router) {
        this.router.events.subscribe((event) => {
            if (event instanceof NavigationEnd && event.urlAfterRedirects !== '/login') {
                sessionStorage.setItem('lastUrl', event.urlAfterRedirects);
            }
        });
    }
}
