import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const authGuardMain: CanActivateFn = async () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    return (await auth.isAuthenticated()) ? true : router.parseUrl('/login');
};

export const authGuardLogin: CanActivateFn = async () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    const previousUrl = sessionStorage.getItem('lastUrl') || '/summary';

    return (await auth.isAuthenticated()) ? router.parseUrl(previousUrl) : true;
};
