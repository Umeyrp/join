import { Component, input, signal, inject, computed, output, effect } from '@angular/core';
import { ContactsService } from '../../../core/contacts.service';
import { Contact, getAvatarColor, getInitials } from '../../../interfaces/contact';

type DropdownMode = 'contacts' | 'category';

const CATEGORIES = ['Technical Task', 'User Story'];

@Component({
    selector: 'app-dropdown',
    imports: [],
    templateUrl: './dropdown.html',
    styleUrl: './dropdown.scss',
})
export class Dropdown {
    mode = input.required<DropdownMode>();

    private contactsService = inject(ContactsService);

    isOpen = signal(false);
    selectedContacts = signal<Contact[]>([]);
    selectedCategory = signal<string | null>(null);
    searchQuery = signal('');
    reset = input<boolean>();

    contacts = this.contactsService.contacts;
    categories = CATEGORIES;

    contactsChanged = output<Contact[]>();
    categoryChanged = output<string>();

    getAvatarColor = getAvatarColor;
    getInitials = getInitials;

    constructor() {
        effect(() => {
            this.reset();
            this.selectedContacts.set([]);
            this.selectedCategory.set(null);
            this.searchQuery.set('');
            this.isOpen.set(false);
        });
    }

    toggle() {
        this.isOpen.update((v) => !v);
    }

    selectCategory(value: string) {
        this.selectedCategory.set(value);
        this.isOpen.set(false);
        this.categoryChanged.emit(value);
    }

    toggleContact(contact: Contact) {
        this.selectedContacts.update((current) =>
            current.some((c) => c.id === contact.id)
                ? current.filter((c) => c.id !== contact.id)
                : [...current, contact],
        );

        this.contactsChanged.emit(this.selectedContacts());
    }

    isSelected(contact: Contact): boolean {
        return this.selectedContacts().some((c) => c.id === contact.id);
    }

    filteredContacts = computed(() =>
        this.contacts().filter((c) =>
            c.name.toLowerCase().includes(this.searchQuery().toLowerCase()),
        ),
    );
}
