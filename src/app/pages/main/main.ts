import { Component, inject } from '@angular/core';
import { Header } from '../../shared/header/header';
import { Navbar } from '../../shared/navbar/navbar';
import { RouterOutlet } from '@angular/router';

@Component({
    selector: 'app-main',
    imports: [Header, Navbar, RouterOutlet],
    templateUrl: './main.html',
    styleUrl: './main.scss',
})
export class Main {}
