import { Component, inject, input, computed, effect, signal } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ContactMobileButton } from '../contact-mobile-button/contact-mobile-button';
import { ContactsService } from '../../../../core/contacts.service';
import { Contact, getAvatarColor, getInitials } from '../../../../interfaces/contact';
import { PhoneFormatPipe } from '../../../../shared/pipes/phone-format-pipe';
import { ContactsOverlayService } from '../../../../core/contacts-overlay-service';

/** Direction of the slide animation when switching between contacts. */
type SlideDirection = 'first' | 'up' | 'down';

/**
 * Detail panel for a single contact, rendered inside the contacts `RouterOutlet`.
 *
 * Animates a slide transition when navigating between contacts:
 * sliding up when moving to a contact further down the list and vice versa.
 * Toast notifications for create/edit/delete actions are cleared after 3 seconds.
 */
@Component({
    selector: 'app-contact-details',
    imports: [PhoneFormatPipe, NgTemplateOutlet, RouterLink, ContactMobileButton],
    templateUrl: './contact-details.html',
    styleUrl: './contact-details.scss',
})
export class ContactDetails {
    private contactsService = inject(ContactsService);
    protected contactsOverlayService = inject(ContactsOverlayService);

    /** The route param `id` of the contact to display. */
    readonly id = input.required<string>();

    /** The contact matching the current `id` route param, or `undefined` if not found. */
    protected readonly contact = computed(() =>
        this.contactsService.contacts().find((c) => c.id === Number(this.id())),
    );

    /** The contact that is sliding out during a transition, or `null` when idle. */
    protected readonly outgoingContact = signal<Contact | null>(null);

    /** Current slide direction or `null` between animation frames. */
    protected readonly direction = signal<SlideDirection | null>('first');

    private previousId: string | null = null;
    private outgoingTimeout?: ReturnType<typeof setTimeout>;

    /**
     * Effect that computes the slide direction whenever the active contact `id` changes.
     * Compares the previous and current list indices to determine up vs. down,
     * then clears the outgoing contact after the 300 ms CSS transition completes.
     */
    private readonly directionEffect = effect(() => {
        const currentId = this.id();
        const contacts = this.contactsService.contacts();

        if (this.previousId !== null && this.previousId !== currentId) {
            this.animateTransition(currentId, contacts);
        }

        this.previousId = currentId;
    });

    /**
     * Calculates and applies the slide animation between two contacts.
     *
     * @param currentId - The ID of the newly active contact
     * @param contacts - The current full contact list (used to determine indices)
     */
    private animateTransition(currentId: string, contacts: Contact[]): void {
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

    /**
     * Builds a `tel:` URI from a phone number string by stripping whitespace.
     *
     * @param phone - The raw phone number
     * @returns A `tel:`-prefixed URI ready for use in an `<a>` tag
     */
    protected telLink(phone: string): string {
        return 'tel:' + phone.replace(/\s+/g, '');
    }

    protected readonly getAvatarColor = getAvatarColor;
    protected readonly getInitials = getInitials;

    /**
     * Deletes the current contact and records the action for the toast.
     */
    async onDelete(): Promise<void> {
        await this.contactsService.deleteContact(this.contact()!.id);
        this.contactsOverlayService.lastAction.set('deleted');
    }

    /**
     * Effect that clears the `lastAction` toast signal after 3 seconds.
     */
    private readonly toastEffect = effect(() => {
        if (this.contactsOverlayService.lastAction()) {
            setTimeout(() => this.contactsOverlayService.lastAction.set(null), 3000);
        }
    });
}
