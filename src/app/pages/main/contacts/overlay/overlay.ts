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
    overlayisOpen = input.required<boolean>();
    overlayisEditMode = input.required<boolean>();
    contact = input.required<Contact | undefined>();
    private contactsService = inject(ContactsService);

    open = input.required<boolean>();
    closed = output<void>();

    isSaving = signal(false);

    onClose(): void {
        this.closed.emit();
    }

    name = signal('');
    email = signal('');
    phone = signal('');

    constructor() {
        effect(() => {
            console.log(this.contact());

            const c = this.contact();
            this.name.set(c?.name ?? '');
            this.email.set(c?.email ?? '');
            this.phone.set(c?.phone ?? '');
        });
    }

    protected readonly getAvatarColor = getAvatarColor;
    protected readonly getInitials = getInitials;
    async onSubmit(event: Event, name: string, email: string, phone: string): Promise<void> {
        event.preventDefault();
        this.isSaving.set(true);
        try {
            await this.contactsService.addContact({ name, email, phone });
            this.onClose();
        } finally {
            this.isSaving.set(false);
        }
    }
}
