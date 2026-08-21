import { Component, inject } from '@angular/core';
import { Header } from '../../shared/header/header';
import { Navbar } from '../../shared/navbar/navbar';
import { RouterOutlet } from '@angular/router';
import { ContactsOverlayService } from '../../core/contacts-overlay-service';
import { Overlay } from './contacts/overlay/overlay';

@Component({
    selector: 'app-main',
    imports: [Header, Navbar, RouterOutlet, Overlay],
    templateUrl: './main.html',
    styleUrl: './main.scss',
})
export class Main {
    contactsOverlayService = inject(ContactsOverlayService);
}
