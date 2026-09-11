import { Component } from '@angular/core';
import { Header } from '../../shared/header/header';
import { Navbar } from '../../shared/navbar/navbar';
import { RouterOutlet } from '@angular/router';

/**
 * Root shell component for authenticated views.
 *
 * Composes the persistent `Header`, `Navbar`, and the `RouterOutlet`
 * that renders the active child route.
 */
@Component({
    selector: 'app-main',
    imports: [Header, Navbar, RouterOutlet],
    templateUrl: './main.html',
    styleUrl: './main.scss',
})
export class Main {}
