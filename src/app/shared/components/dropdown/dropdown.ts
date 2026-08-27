import {
    Component,
    input,
    signal,
    inject,
    computed,
    output,
    effect,
    viewChild,
    ElementRef,
    HostListener,
} from '@angular/core';
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
    private el = inject(ElementRef);

    isOpen = signal(false);
    selectedContacts = signal<Contact[]>([]);
    selectedCategory = signal<string | null>(null);
    searchQuery = signal('');
    reset = input<boolean>();
    closed = output<void>();

    initialContacts = input<Contact[]>([]);
    initialCategory = input<string | null>(null);

    contacts = this.contactsService.contacts;
    categories = CATEGORIES;

    contactsChanged = output<Contact[]>();
    categoryChanged = output<string>();
    searchInput = viewChild<ElementRef<HTMLInputElement>>('searchInput');

    getAvatarColor = getAvatarColor;
    getInitials = getInitials;

    constructor() {
        effect(() => {
            this.reset();
            const initialContacts = this.initialContacts();
            const initialCategory = this.initialCategory();

            this.selectedContacts.set(initialContacts);
            this.selectedCategory.set(initialCategory);
            this.searchQuery.set('');
            this.isOpen.set(false);
        });

        effect(() => {
            if (this.isOpen()) {
                setTimeout(() => this.searchInput()?.nativeElement.focus(), 170);
            }
        });
    }

    toggle() {
        if (this.isOpen()) {
            this.closed.emit();
        }
        if (!this.isOpen()) {
            window.dispatchEvent(new CustomEvent('dropdown-open', { detail: this }));
        }
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

    @HostListener('document:click', ['$event'])
    onDocumentClick(event: MouseEvent) {
        if (!this.el.nativeElement.contains(event.target as Node)) {
            if (this.isOpen()) this.closed.emit();
            this.isOpen.set(false);
        }
    }

    @HostListener('window:dropdown-open', ['$event'])
    onOtherDropdownOpen(event: Event) {
        if ((event as CustomEvent).detail !== this) {
            this.isOpen.set(false);
        }
    }
}
