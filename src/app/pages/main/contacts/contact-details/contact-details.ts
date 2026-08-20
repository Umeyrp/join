import { Component, inject, input, computed, effect, signal } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ContactsService } from '../../../../core/contacts.service';
import { Contact, getAvatarColor, getInitials } from '../../../../interfaces/contact';
import { PhoneFormatPipe } from '../../../../shared/pipes/phone-format-pipe';
import { ContactsOverlayService } from '../../../../core/contacts-overlay-service';

type SlideDirection = 'first' | 'up' | 'down';

@Component({
    selector: 'app-contact-details',
    imports: [PhoneFormatPipe, NgTemplateOutlet, RouterLink],
    templateUrl: './contact-details.html',
    styleUrl: './contact-details.scss',
})
export class ContactDetails {
    private contactsService = inject(ContactsService);
    protected contactsOverlayService = inject(ContactsOverlayService);

    readonly id = input.required<string>();

    protected readonly contact = computed(() =>
        this.contactsService.contacts().find((c) => c.id === Number(this.id())),
    );

    protected readonly outgoingContact = signal<Contact | null>(null);
    protected readonly direction = signal<SlideDirection | null>('first');

    private previousId: string | null = null;
    private outgoingTimeout?: ReturnType<typeof setTimeout>;

    private readonly directionEffect = effect(() => {
        const currentId = this.id();
        const contacts = this.contactsService.contacts();

        if (this.previousId !== null && this.previousId !== currentId) {
            const previousIndex = contacts.findIndex((c) => c.id === Number(this.previousId));
            const currentIndex = contacts.findIndex((c) => c.id === Number(currentId));
            const outgoing = contacts.find((c) => c.id === Number(this.previousId)) ?? null;

            const newDirection: SlideDirection = currentIndex > previousIndex ? 'up' : 'down';
            this.direction.set(null);
            requestAnimationFrame(() => this.direction.set(newDirection));
            this.outgoingContact.set(outgoing);

            clearTimeout(this.outgoingTimeout);
            this.outgoingTimeout = setTimeout(() => this.outgoingContact.set(null), 300);
        }

        this.previousId = currentId;
    });

    protected telLink(phone: string): string {
        return 'tel:' + phone.replace(/\s+/g, '');
    }

    protected readonly getAvatarColor = getAvatarColor;
    protected readonly getInitials = getInitials;

    async onDelete() {
        await this.contactsService.deleteContact(this.contact()!.id);
        this.contactsOverlayService.lastAction.set('deleted');
    }

    private readonly toastEffect = effect(() => {
        if (this.contactsOverlayService.lastAction()) {
            setTimeout(() => {
                this.contactsOverlayService.lastAction.set(null);
            }, 3000);
        }
    });
}
