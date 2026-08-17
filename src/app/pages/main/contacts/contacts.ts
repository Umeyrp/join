import { Component, inject, computed, signal } from '@angular/core';
import { ContactsService } from '../../../core/contacts.service';
import { Contact, getAvatarColor, getInitials } from '../../../interfaces/contact';
import { Button } from '../../../shared/component/button/button';

interface ContactGroup {
  letter: string;
  contacts: Contact[];
}

@Component({
  selector: 'app-contacts',
  imports: [Button],
  templateUrl: './contacts.html',
  styleUrl: './contacts.scss',
})
export class Contacts {
  private contactsService = inject(ContactsService);

  protected readonly isLoading = this.contactsService.isLoading;
  protected readonly loadError = this.contactsService.loadError;
  protected readonly selectedContactId = signal<number | null>(null);

  groups = computed<ContactGroup[]>(() => {
    const contacts = this.contactsService.contacts();
    const map = new Map<string, Contact[]>();

    for (const contact of contacts) {
      const letter = contact.name.trim()[0]?.toUpperCase() ?? '#';
      if (!map.has(letter)) map.set(letter, []);
      map.get(letter)!.push(contact);
    }

    return [...map.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([letter, contacts]) => ({ letter, contacts }));
  });

  protected selectContact(id: number): void {
    this.selectedContactId.set(id);
  }

  protected readonly getAvatarColor = getAvatarColor;
  protected readonly getInitials = getInitials;
}
