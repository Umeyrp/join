import { Component, inject, computed, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ContactsService } from '../../../core/contacts.service';
import { Contact, getAvatarColor, getInitials } from '../../../interfaces/contact';
import { Button } from '../../../shared/components/button/button';
import { Overlay } from './overlay/overlay';
import { ContactsOverlayService } from '../../../core/contacts-overlay-service';

interface ContactGroup {
    letter: string;
    contacts: Contact[];
}

@Component({
    selector: 'app-contacts',
    imports: [Button, RouterLink, RouterLinkActive, RouterOutlet, Overlay],
    templateUrl: './contacts.html',
    styleUrl: './contacts.scss',
})
export class Contacts {
    private contactsService = inject(ContactsService);
    protected contactsOverlayService = inject(ContactsOverlayService);

    protected readonly isLoading = this.contactsService.isLoading;
    protected readonly loadError = this.contactsService.loadError;

    groups = computed<ContactGroup[]>(() => {
        const contacts = this.contactsService.contacts();
        const map = new Map<string, Contact[]>();

        for (const contact of contacts) {
            const letter = contact.name.trim()[0]?.toUpperCase() ?? '#';
            if (!map.has(letter)) map.set(letter, []);
            map.get(letter)!.push(contact);
        }

        return [...map.entries()]
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([letter, contacts]) => ({ letter, contacts }));
    });

    protected readonly getAvatarColor = getAvatarColor;
    protected readonly getInitials = getInitials;
}
