import {
    Component,
    effect,
    ElementRef,
    inject,
    input,
    output,
    signal,
    viewChild,
} from '@angular/core';
import { ContactsService } from '../../../../core/contacts.service';
import { Contact, getAvatarColor, getInitials, NewContact } from '../../../../interfaces/contact';
import { form, pattern, required, FormField, submit } from '@angular/forms/signals';
import { Router } from '@angular/router';
import { Button } from '../../../../shared/components/button/button';

/**
 * Modal overlay for creating, editing, and deleting contacts.
 *
 * Uses a native `<dialog>` element opened programmatically via `showModal()`.
 * The form is built with Angular Signals Forms and validates name, email,
 * and phone on submit. After a successful save the overlay emits `closed`
 * with the performed action so the parent can show a toast.
 */
@Component({
    selector: 'app-contact-overlay',
    imports: [FormField, Button],
    templateUrl: './contact-overlay.html',
    styleUrl: './contact-overlay.scss',
})
export class ContactOverlay {
    private dialogRef = viewChild<ElementRef<HTMLDialogElement>>('dialog');
    private contactsService = inject(ContactsService);
    private router = inject(Router);

    /** Whether the overlay is currently open. */
    overlayisOpen = input.required<boolean>();

    /** Whether the overlay is in edit mode (vs. add mode). */
    overlayisEditMode = input.required<boolean>();

    /** The contact to edit or `null` when adding a new contact. */
    contact = input.required<Contact | null>();

    /** Emitted when the overlay closes, carrying the action performed or `null` on cancel. */
    closed = output<'created' | 'edited' | 'deleted' | null>();

    /** `true` while an async save or delete operation is running. */
    isSaving = signal(false);

    protected readonly getAvatarColor = getAvatarColor;
    protected readonly getInitials = getInitials;

    /** Reactive model backing the contact form fields. */
    contactModel = signal<NewContact>({ name: '', email: '', phone: '' });

    /** Signals Form with validation rules for name, email, and phone. */
    contactForm = form(this.contactModel, (s) => {
        required(s.name, { message: 'First and last name are required' });
        pattern(s.name, /^\p{L}+ \p{L}+$/u, { message: 'First and last name are required' });
        required(s.email, { message: 'Email is required' });
        pattern(s.email, /[^@ \t\r\n]+@[^@ \t\r\n]+\.[^@ \t\r\n]+/, {
            message: 'Please enter a valid email address',
        });
        required(s.phone, { message: 'Phone number is required' });
        pattern(s.phone, /^\+?[0-9\s().-]{7,20}$/, {
            message: 'Please enter a valid phone number',
        });
    });

    constructor() {
        effect(() => {
            const dialog = this.dialogRef()?.nativeElement;
            if (dialog && !dialog.open) dialog.showModal();
        });

        effect(() => {
            if (!this.overlayisOpen()) return;
            this.resetFormToContact(this.contact());
        });
    }

    /**
     * Resets the form and pre-fills it with the given contact's data.
     * Called whenever the overlay opens or the contact changes.
     *
     * @param contact - The contact to pre-fill, or `null` for an empty add form
     */
    private resetFormToContact(contact: Contact | null): void {
        this.contactForm().reset();
        this.contactModel.set({
            name: contact?.name ?? '',
            email: contact?.email ?? '',
            phone: contact?.phone ?? '',
        });
    }

    /**
     * Closes the overlay when the user clicks the backdrop (the `<dialog>` element itself).
     *
     * @param event - The click event on the dialog element
     */
    onDialogClick(event: MouseEvent): void {
        if (event.target === this.dialogRef()?.nativeElement) this.close();
    }

    /**
     * Cancels the overlay, preventing the default form submission.
     *
     * @param event - The cancel/button click event
     */
    onCancel(event: Event): void {
        event.preventDefault();
        this.close();
    }

    /** Closes the overlay without performing any action. */
    onCloseButtonClick(): void {
        this.close();
    }

    /**
     * Emits `closed` with the given action and dismisses the overlay.
     *
     * @param action - The action to report to the parent or `null` on cancel
     */
    close(action: 'created' | 'edited' | 'deleted' | null = null): void {
        this.closed.emit(action);
    }

    /**
     * Validates and submits the form.
     * In edit mode updates the existing contact; in add mode inserts a new one
     * and navigates to its detail route.
     *
     * @param event - The native form submit event (default is prevented internally)
     */
    async onSubmit(event: Event): Promise<void> {
        event.preventDefault();
        await submit(this.contactForm, async (f) => {
            const { name, email, phone } = f().value();
            this.isSaving.set(true);
            try {
                await this.saveContact(name, email, phone);
                return null;
            } finally {
                this.isSaving.set(false);
            }
        });
    }

    /**
     * Persists the contact — updates an existing one or inserts a new one.
     *
     * @param name - Validated name from the form
     * @param email - Validated email from the form
     * @param phone - Validated phone from the form
     */
    private async saveContact(name: string, email: string, phone: string): Promise<void> {
        if (this.overlayisEditMode()) {
            await this.contactsService.updateContact(this.contact()!.id, { name, email, phone });
            this.close('edited');
        } else {
            const newContact = await this.contactsService.addContact({ name, email, phone });
            this.router.navigate(['/contacts', newContact.id]);
            this.close('created');
        }
    }

    /**
     * Deletes the current contact after confirming via `isSaving` guard.
     * Navigating away and emitting `'deleted'` is handled by the parent.
     */
    async onDelete(): Promise<void> {
        this.isSaving.set(true);
        try {
            await this.contactsService.deleteContact(this.contact()!.id);
            this.close('deleted');
        } finally {
            this.isSaving.set(false);
        }
    }
}
