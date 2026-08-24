import { Service, signal } from '@angular/core';
import { Contact } from '../interfaces/contact';

@Service()
export class ContactsOverlayService {
    isOpen = signal(false);
    isEditMode = signal(false);
    selectedContact = signal<Contact | null>(null);
    lastAction = signal<'created' | 'edited' | 'deleted' | null>(null);

    openAddOverlay() {
        this.isEditMode.set(false);
        this.selectedContact.set(null);
        this.isOpen.set(true);
    }

    openEditOverlay(contact: Contact) {
        this.isEditMode.set(true);
        this.selectedContact.set(contact);
        this.isOpen.set(true);
    }

    closeOverlay(action: 'created' | 'edited' | 'deleted' | null = null) {
        console.log(action);
        
        this.isOpen.set(false);
        this.lastAction.set(action);
    }
}
