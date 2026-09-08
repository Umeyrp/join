import { Component, computed, inject, signal } from '@angular/core';
import { RouterLinkActive, RouterLinkWithHref } from '@angular/router';
import { AuthService } from '../../core/auth.service';

@Component({
    selector: 'app-navbar',
    imports: [RouterLinkActive, RouterLinkWithHref],
    templateUrl: './navbar.html',
    styleUrl: './navbar.scss',
})
export class Navbar {
    private auth = inject(AuthService);
    isLoggedIn = computed(() => this.auth.currentUser() !== null);
}
