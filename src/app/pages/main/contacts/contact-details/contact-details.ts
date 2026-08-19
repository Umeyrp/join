import { Component, inject, input, computed, effect } from '@angular/core';
import { ContactsService } from '../../../../core/contacts.service';
import { getAvatarColor, getInitials } from '../../../../interfaces/contact';
import { PhoneFormatPipe } from '../../../../shared/pipes/phone-format-pipe';
import { ContactsOverlayService } from '../../../../core/contacts-overlay-service';

@Component({
    selector: 'app-contact-details',
    imports: [PhoneFormatPipe],
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
