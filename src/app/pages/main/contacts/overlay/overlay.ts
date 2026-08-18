import { Component, effect, input, output, signal } from '@angular/core';
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
    closed = output<void>();
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
}
