import { Component, inject, input, output, signal } from '@angular/core';
import { ContactsService } from '../../../../core/contacts.service';

@Component({
    selector: 'app-overlay',
    imports: [],
    templateUrl: './overlay.html',
    styleUrl: './overlay.scss',
})
export class Overlay {
    private contactsService = inject(ContactsService);

    open = input.required<boolean>();
    closed = output<void>();

    isSaving = signal(false);

    onClose(): void {
        this.closed.emit();
    }

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
