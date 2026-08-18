import { Service, signal } from '@angular/core';
import { Contact } from '../interfaces/contact';

@Service()
export class ContactsOverlayService {
    isOpen = signal(false);
    isEditMode = signal(false);
    selectedContact = signal<Contact | undefined>(undefined);

    openAddOverlay() {
        this.isEditMode.set(false);
        this.selectedContact.set(undefined);
        this.isOpen.set(true);
    }

    openEditOverlay(contact?: Contact) {
        this.isEditMode.set(true);
        this.selectedContact.set(contact);
        this.isOpen.set(true);
    }

    closeOverlay() {
        this.isOpen.set(false);
    }
}
