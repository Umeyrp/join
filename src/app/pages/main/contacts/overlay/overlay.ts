import { Component, effect, inject, input, output, signal } from '@angular/core';
import { ContactsService } from '../../../../core/contacts.service';
import { Contact, getAvatarColor, getInitials } from '../../../../interfaces/contact';

@Component({
    selector: 'app-overlay',
    imports: [],
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

    name = signal('');
    email = signal('');
    phone = signal('');

    constructor() {
        effect(() => {
            const c = this.contact();
            this.name.set(c?.name ?? '');
            this.email.set(c?.email ?? '');
            this.phone.set(c?.phone ?? '');
        });
    }

    onClose(action: 'created' | 'edited' | 'deleted' | null = null) {
        this.closed.emit(action);
    }

    async onSubmit(event: Event, name: string, email: string, phone: string): Promise<void> {
        event.preventDefault();
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
        } finally {
            this.isSaving.set(false);
        }
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
