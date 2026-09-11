import { Component, computed, inject } from '@angular/core';
import { RouterLinkActive, RouterLinkWithHref } from '@angular/router';
import { AuthService } from '../../core/auth.service';

/**
 * Sidebar navigation component.
 *
 * Renders the main nav links and conditionally shows or hides
 * them based on the user's authentication state.
 */
@Component({
    selector: 'app-navbar',
    imports: [RouterLinkActive, RouterLinkWithHref],
    templateUrl: './navbar.html',
    styleUrl: './navbar.scss',
})
export class Navbar {
    private auth = inject(AuthService);

    /** Whether a user is currently logged in. */
    isLoggedIn = computed(() => this.auth.currentUser() !== null);
}
