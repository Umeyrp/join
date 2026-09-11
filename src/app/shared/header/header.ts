import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { getInitials } from '../../interfaces/contact';

/**
 * Application header component.
 *
 * Displays the logo, navigation links, and the user avatar with a dropdown menu.
 * The avatar shows the user's initials or `'G'` for guest users.
 * On mobile the nav links are hidden behind a hamburger toggle.
 */
@Component({
    selector: 'app-header',
    imports: [RouterLink],
    templateUrl: './header.html',
    styleUrl: './header.scss',
})
export class Header {
    private auth = inject(AuthService);
    private router = inject(Router);

    /** Whether a user is currently logged in. */
    isLoggedIn = computed(() => this.auth.currentUser() !== null);

    /** Whether the user dropdown menu is currently open. */
    isMenuOpen = signal(false);

    /**
     * The initials shown inside the avatar circle.
     * Returns `'G'` for guest users, otherwise delegates to `getInitials`.
     */
    initials = computed(() => {
        const user = this.auth.currentUser();
        if (!user || user.isGuest) return 'G';
        return getInitials(user.name);
    });

    /**
     * Toggles the user dropdown menu open or closed.
     */
    toggleMenu(): void {
        this.isMenuOpen.update((v) => !v);
    }

    /**
     * Logs out the current user and redirects to the login page.
     */
    async logout(): Promise<void> {
        await this.auth.logout();
        await this.router.navigate(['/login']);
    }
}
