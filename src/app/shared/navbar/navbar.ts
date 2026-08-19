import { Component, signal } from '@angular/core';
import { RouterLinkActive, RouterLinkWithHref } from '@angular/router';

@Component({
    selector: 'app-navbar',
    imports: [RouterLinkActive, RouterLinkWithHref],
    templateUrl: './navbar.html',
    styleUrl: './navbar.scss',
})
export class Navbar {
    isLoggedIn = signal(true);
}
