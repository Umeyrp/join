import { Component, inject, computed, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ContactsService } from '../../../core/contacts.service';
import { Contact, getAvatarColor, getInitials } from '../../../interfaces/contact';
import { Button } from '../../../shared/components/button/button';
import { ContactOverlay } from './contact-overlay/contact-overlay';
import { ContactMobileButton } from './contact-mobile-button/contact-mobile-button';
import { ContactsOverlayService } from '../../../core/contacts-overlay-service';

/** A group of contacts sharing the same first letter, used for the alphabetical list. */
interface ContactGroup {
    /** The uppercase first letter all contacts in this group share. */
    letter: string;
    /** Contacts belonging to this letter group. */
    contacts: Contact[];
}

/**
 * Contacts list page.
 *
 * Renders all contacts grouped and sorted alphabetically by first letter.
 * Selecting a contact opens its detail route via `RouterOutlet`.
 * Adding and editing contacts is handled by `ContactOverlay`.
 */
@Component({
    selector: 'app-contacts',
    imports: [
        Button,
        RouterLink,
        RouterLinkActive,
        RouterOutlet,
        ContactMobileButton,
        ContactOverlay,
    ],
    templateUrl: './contacts.html',
    styleUrl: './contacts.scss',
})
export class Contacts {
    private contactsService = inject(ContactsService);
    protected contactsOverlayService = inject(ContactsOverlayService);

    /** Whether a contact detail panel is currently selected/visible. */
    protected readonly hasSelectedContact = signal(false);

    /** Forwarded from `ContactsService` — `true` while the initial load is running. */
    protected readonly isLoading = this.contactsService.isLoading;

    /** Forwarded from `ContactsService` — error message or `null`. */
    protected readonly loadError = this.contactsService.loadError;

    /**
     * All contacts grouped by their uppercased first letter and sorted alphabetically.
     * The `'#'` group collects contacts whose name does not start with a letter.
     */
    readonly groups = computed<ContactGroup[]>(() => {
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

    /** Exposed avatar color helper for use in the template. */
    protected readonly getAvatarColor = getAvatarColor;

    /** Exposed initials helper for use in the template. */
    protected readonly getInitials = getInitials;
}
