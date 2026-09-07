import { Component, inject, signal } from '@angular/core';
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
    isLoggedIn = true;
    isMenuOpen = signal(false);

    toggleMenu() {
        this.isMenuOpen.update((v) => !v);
    }

    async logout() {
        await this.auth.logout();
        await this.router.navigate(['/login']);
    }
}
