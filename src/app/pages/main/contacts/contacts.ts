import { Component, signal } from '@angular/core';
import { Overlay } from './overlay/overlay';

@Component({
    selector: 'app-contacts',
    imports: [Overlay],
    templateUrl: './contacts.html',
    styleUrl: './contacts.scss',
})
export class Contacts {
    isOverlayOpen = signal(false);

    openOverlay(): void {
        this.isOverlayOpen.set(true);
    }

    closeOverlay(): void {
        this.isOverlayOpen.set(false);
    }
}
