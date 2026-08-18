import { Component, inject, input, computed } from '@angular/core';
import { ContactsService } from '../../../../core/contacts.service';
import { getAvatarColor, getInitials } from '../../../../interfaces/contact';
import { PhoneFormatPipe } from '../../../../shared/pipes/phone-format-pipe';

@Component({
  selector: 'app-contact-details',
  imports: [PhoneFormatPipe],
  templateUrl: './contact-details.html',
  styleUrl: './contact-details.scss',
})
export class ContactDetails {
  private contactsService = inject(ContactsService);

  readonly id = input.required<string>();

  protected readonly contact = computed(() =>
    this.contactsService.contacts().find((c) => c.id === Number(this.id())),
  );

  protected telLink(phone: string): string {
    return 'tel:' + phone.replace(/\s+/g, '');
  }

  protected readonly getAvatarColor = getAvatarColor;
  protected readonly getInitials = getInitials;
}
