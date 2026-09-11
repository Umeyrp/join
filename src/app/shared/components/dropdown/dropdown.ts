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

/** Controls which list the dropdown renders — contact multi-select or category single-select. */
type DropdownMode = 'contacts' | 'category';

const CATEGORIES = ['Technical Task', 'User Story'];

/**
 * Multi-purpose dropdown component for contact assignment and category selection.
 *
 * Operates in two modes controlled by the `mode` input:
 * - `'contacts'` — searchable multi-select list of all contacts
 * - `'category'` — single-select list of task categories
 *
 * Multiple instances coordinate via a `CustomEvent` on `window` so that
 * opening one dropdown closes all others. Outside clicks are handled via
 * a `document:click` host listener.
 *
 * Initial values are set via `initialContacts` / `initialCategory` and
 * can be reset by toggling the `reset` input.
 */
@Component({
    selector: 'app-dropdown',
    imports: [],
    templateUrl: './dropdown.html',
    styleUrl: './dropdown.scss',
})
export class Dropdown {
    /** Whether to render a contact multi-select or a category single-select. */
    mode = input.required<DropdownMode>();

    /** Toggling this input resets all selections and closes the dropdown. */
    reset = input<boolean>();

    /** Pre-selected contacts shown when the dropdown is first opened (contacts mode). */
    initialContacts = input<Contact[]>([]);

    /** Pre-selected category shown when the dropdown is first opened (category mode). */
    initialCategory = input<string | null>(null);

    /** Emitted whenever the contact selection changes. */
    contactsChanged = output<Contact[]>();

    /** Emitted when a category is selected. */
    categoryChanged = output<string>();

    /** Emitted when the dropdown closes (outside click or toggle). */
    closed = output<void>();

    private contactsService = inject(ContactsService);
    private el = inject(ElementRef);

    /** Whether the dropdown panel is currently visible. */
    isOpen = signal(false);

    /** Currently selected contacts (contacts mode). */
    selectedContacts = signal<Contact[]>([]);

    /** Currently selected category or `null` if none selected (category mode). */
    selectedCategory = signal<string | null>(null);

    /** Current value of the contact search input. */
    searchQuery = signal('');

    /** All available contacts from the contacts service. */
    contacts = this.contactsService.contacts;

    /** Available category options. */
    categories = CATEGORIES;

    /** Reference to the search input element for programmatic focus. */
    searchInput = viewChild<ElementRef<HTMLInputElement>>('searchInput');

    /** Exposed avatar color helper for use in the template. */
    getAvatarColor = getAvatarColor;

    /** Exposed initials helper for use in the template. */
    getInitials = getInitials;

    /**
     * Contacts filtered by the current search query (case-insensitive name match).
     */
    filteredContacts = computed(() =>
        this.contacts().filter((c) =>
            c.name.toLowerCase().includes(this.searchQuery().toLowerCase()),
        ),
    );

    constructor() {
        effect(() => {
            this.reset();
            this.selectedContacts.set(this.initialContacts());
            this.selectedCategory.set(this.initialCategory());
            this.searchQuery.set('');
            this.isOpen.set(false);
        });

        effect(() => {
            if (this.isOpen()) {
                setTimeout(() => this.searchInput()?.nativeElement.focus(), 170);
            }
        });
    }

    /**
     * Toggles the dropdown open or closed.
     * Emits `closed` when closing and broadcasts a `dropdown-open` window event
     * when opening so other instances can close themselves.
     */
    toggle(): void {
        if (this.isOpen()) {
            this.closed.emit();
        }
        if (!this.isOpen()) {
            window.dispatchEvent(new CustomEvent('dropdown-open', { detail: this }));
        }
        this.isOpen.update((v) => !v);
    }

    /**
     * Selects a category, closes the dropdown, and emits `categoryChanged`.
     *
     * @param value - The selected category string
     */
    selectCategory(value: string): void {
        this.selectedCategory.set(value);
        this.isOpen.set(false);
        this.categoryChanged.emit(value);
    }

    /**
     * Toggles a contact in or out of the current selection and emits `contactsChanged`.
     *
     * @param contact - The contact to add or remove
     */
    toggleContact(contact: Contact): void {
        this.selectedContacts.update((current) =>
            current.some((c) => c.id === contact.id)
                ? current.filter((c) => c.id !== contact.id)
                : [...current, contact],
        );
        this.contactsChanged.emit(this.selectedContacts());
    }

    /**
     * Checks whether a contact is currently selected.
     *
     * @param contact - The contact to check
     * @returns `true` if the contact is in the current selection
     */
    isSelected(contact: Contact): boolean {
        return this.selectedContacts().some((c) => c.id === contact.id);
    }

    /**
     * Closes the dropdown when a click occurs outside the component's host element.
     *
     * @param event - The native mouse event from the document click listener
     */
    @HostListener('document:click', ['$event'])
    onDocumentClick(event: MouseEvent): void {
        if (!this.el.nativeElement.contains(event.target as Node)) {
            if (this.isOpen()) this.closed.emit();
            this.isOpen.set(false);
        }
    }

    /**
     * Closes this dropdown when another dropdown instance broadcasts `dropdown-open`.
     *
     * @param event - The custom window event carrying the emitting instance as `detail`
     */
    @HostListener('window:dropdown-open', ['$event'])
    onOtherDropdownOpen(event: Event): void {
        if ((event as CustomEvent).detail !== this) {
            this.isOpen.set(false);
        }
    }
}
