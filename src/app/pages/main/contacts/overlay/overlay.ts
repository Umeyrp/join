import { Component, effect, inject, input, output, signal } from '@angular/core';
import { ContactsService } from '../../../../core/contacts.service';
import { Contact, getAvatarColor, getInitials, NewContact } from '../../../../interfaces/contact';
import {
    email,
    form,
    minLength,
    pattern,
    required,
    FormField,
    submit,
} from '@angular/forms/signals';

@Component({
    selector: 'app-overlay',
    imports: [FormField],
    templateUrl: './overlay.html',
    styleUrl: './overlay.scss',
})
export class Overlay {
    protected readonly getAvatarColor = getAvatarColor;
    protected readonly getInitials = getInitials;
    private contactsService = inject(ContactsService);

    overlayisOpen = input.required<boolean>();
    overlayisEditMode = input.required<boolean>();
    contact = input.required<Contact | null>();
    closed = output<'created' | 'edited' | 'deleted' | null>();
    isSaving = signal(false);

    contactModel = signal<NewContact>({
        name: '',
        email: '',
        phone: '',
    });

    contactForm = form(this.contactModel, (schemaPath) => {
        required(schemaPath.name, { message: 'Vor- und Nachname ist erforderlich' });
        pattern(schemaPath.name, /^\p{L}+ \p{L}+$/u, {
            message: 'Bitte Vor- und Nachnamen eingeben',
        });

        required(schemaPath.email, { message: 'E-Mail ist erforderlich' });
        pattern(schemaPath.email, /[^@ \t\r\n]+@[^@ \t\r\n]+\.[^@ \t\r\n]+/, {
            message: 'Bitte gültige E-Mail-Adresse eingeben',
        });

        required(schemaPath.phone, { message: 'Telefonnummer ist erforderlich' });
        pattern(schemaPath.phone, /^\+?[0-9\s().-]{7,20}$/, {
            message: 'Bitte gültige Telefonnummer eingeben',
        });
    });

    constructor() {
        effect(() => {
            this.overlayisOpen();
            const contact = this.contact();

            this.contactForm().reset();
            this.contactModel.set({
                name: contact?.name ?? '',
                email: contact?.email ?? '',
                phone: contact?.phone ?? '',
            });
        });
    }

    onClose(action: 'created' | 'edited' | 'deleted' | null = null) {
        this.closed.emit(action);
    }

    async onSubmit(event: Event): Promise<void> {
        event.preventDefault();

        await submit(this.contactForm, async (f) => {
            const { name, email, phone } = f().value();
            this.isSaving.set(true);

            try {
                if (this.overlayisEditMode()) {
                    await this.contactsService.updateContact(this.contact()!.id, {
                        name,
                        email,
                        phone,
                    });
                    this.onClose('edited');
                } else {
                    await this.contactsService.addContact({ name, email, phone });
                    this.onClose('created');
                }
                return null;
            } finally {
                this.isSaving.set(false);
            }
        });
    }

    async onDelete() {
        this.isSaving.set(true);
        try {
            await this.contactsService.deleteContact(this.contact()!.id);
            this.onClose('deleted');
        } finally {
            this.isSaving.set(false);
        }
    }
}
