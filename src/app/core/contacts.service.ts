import { Service, inject } from '@angular/core';
import { Contact } from '../interfaces/contact';
import { Supabase } from './supabase';

@Service()
export class ContactsService {
  private supabase = inject(Supabase).client;

  async getContacts(): Promise<Contact[]> {
    const { data, error } = await this.supabase
      .from('contacts')
      .select('id, name, email, phone')
      .order('name', { ascending: true });

    if (error) throw error;
    return data as Contact[];
  }
}
