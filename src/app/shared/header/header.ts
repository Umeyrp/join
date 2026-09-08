import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';

@Component({
    selector: 'app-header',
    imports: [RouterLink],
    templateUrl: './header.html',
    styleUrl: './header.scss',
})
export class Header {
    private auth = inject(AuthService);
    private router = inject(Router);

    isLoggedIn = computed(() => this.auth.currentUser() !== null);
    isMenuOpen = signal(false);

    initials = computed(() => {
        const user = this.auth.currentUser();
        if (!user || user.isGuest) return 'G';
        const parts = user.name.trim().split(' ');
        if (parts.length === 1) return parts[0][0].toUpperCase();
        return parts[0][0] + parts[parts.length - 1][0].toUpperCase();
    });

    toggleMenu() {
        this.isMenuOpen.update((v) => !v);
    }

    async logout() {
        await this.auth.logout();
        await this.router.navigate(['/login']);
    }
}
