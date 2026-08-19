import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-header',
    imports: [RouterLink],
    templateUrl: './header.html',
    styleUrl: './header.scss',
})
export class Header {
    isLoggedIn = true;
    isMenuOpen = signal(false);

    toggleMenu() {
        this.isMenuOpen.update((v) => !v);
    }
}
