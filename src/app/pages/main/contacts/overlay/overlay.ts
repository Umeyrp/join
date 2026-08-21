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
import { Router } from '@angular/router';
import { Button } from '../../../../shared/components/button/button';

@Component({
    selector: 'app-overlay',
    imports: [FormField, Button],
    templateUrl: './overlay.html',
    styleUrl: './overlay.scss',
})
export class Overlay {
    protected readonly getAvatarColor = getAvatarColor;
    protected readonly getInitials = getInitials;
    private contactsService = inject(ContactsService);
    private router = inject(Router);

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
        required(schemaPath.name, { message: 'First and last name are required' });
        pattern(schemaPath.name, /^\p{L}+ \p{L}+$/u, {
            message: 'First and last name are required',
        });

        required(schemaPath.email, { message: 'Email is required' });
        pattern(schemaPath.email, /[^@ \t\r\n]+@[^@ \t\r\n]+\.[^@ \t\r\n]+/, {
            message: 'Please enter a valid email address',
        });

        required(schemaPath.phone, { message: 'Phone number is required' });
        pattern(schemaPath.phone, /^\+?[0-9\s().-]{7,20}$/, {
            message: 'Please enter a valid phone number',
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
                    const newContact = await this.contactsService.addContact({
                        name,
                        email,
                        phone,
                    });
                    this.router.navigate(['/contacts', newContact.id]);
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
