import { Service, signal } from '@angular/core';
import { Contact } from '../interfaces/contact';

/**
 * Service for controlling the contact overlay.
 *
 * Manages the open state, edit mode, the currently selected contact,
 * and the last performed action as signals.
 * Components subscribe to these signals directly in the template.
 */
@Service()
export class ContactsOverlayService {
    /** Whether the overlay is currently visible. */
    isOpen = signal(false);

    /** Whether the overlay is open in edit mode. */
    isEditMode = signal(false);

    /** The currently selected contact or `null` in add mode. */
    selectedContact = signal<Contact | null>(null);

    /**
     * The last action performed via the overlay.
     * Read by parent components to control toast notifications.
     */
    lastAction = signal<'created' | 'edited' | 'deleted' | null>(null);

    /**
     * Opens the overlay in add mode.
     * Resets edit mode and the selected contact.
     */
    openAddOverlay(): void {
        this.isEditMode.set(false);
        this.selectedContact.set(null);
        this.isOpen.set(true);
    }

    /**
     * Opens the overlay in edit mode for an existing contact.
     *
     * @param contact - The contact to edit
     */
    openEditOverlay(contact: Contact): void {
        this.isEditMode.set(true);
        this.selectedContact.set(contact);
        this.isOpen.set(true);
    }

    /**
     * Closes the overlay and optionally records the performed action.
     *
     * @param action - The completed action or `null` if cancelled
     */
    closeOverlay(action: 'created' | 'edited' | 'deleted' | null = null): void {
        this.isOpen.set(false);
        this.lastAction.set(action);
    }
}
