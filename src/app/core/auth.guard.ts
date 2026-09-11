import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

/**
 * Guard for protected routes.
 *
 * Allows authenticated users through. Unauthenticated users
 * are redirected to `/login`.
 */
export const authGuardMain: CanActivateFn = async () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    return (await auth.isAuthenticated()) ? true : router.parseUrl('/login');
};

/**
 * Guard for the login route.
 *
 * Already authenticated users are redirected to the last visited route
 * (from `sessionStorage`) or to `/summary` as a fallback.
 * Unauthenticated users are allowed to access the login page.
 */
export const authGuardLogin: CanActivateFn = async () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    const previousUrl = sessionStorage.getItem('lastUrl') || '/summary';

    return (await auth.isAuthenticated()) ? router.parseUrl(previousUrl) : true;
};
