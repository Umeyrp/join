import { Service, inject, signal, type OnDestroy } from '@angular/core';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { Contact } from '../interfaces/contact';
import { Supabase } from './supabase';

type ContactChangePayload = RealtimePostgresChangesPayload<Contact>;

@Service()
export class ContactsService implements OnDestroy {
    private supabase = inject(Supabase).client;

    readonly contacts = signal<Contact[]>([]);
    readonly isLoading = signal(true);
    readonly loadError = signal<string | null>(null);

    private readonly initialLoad = this.loadContacts();
    private readonly channel = this.subscribeToChanges();

    private async loadContacts() {
        try {
            const { data, error } = await this.supabase
                .from('contacts')
                .select('id, name, email, phone')
                .order('name', { ascending: true });

            if (error) throw error;
            this.contacts.set(data as Contact[]);
        } catch {
            this.loadError.set('Fehler beim Laden der Kontakte.');
        } finally {
            this.isLoading.set(false);
        }
    }

    private subscribeToChanges() {
        return this.supabase
            .channel('contacts-changes')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'contacts' },
                (payload: ContactChangePayload) => this.applyChange(payload),
            )
            .subscribe();
    }

    private applyChange(payload: ContactChangePayload) {
        this.contacts.update((list) => {
            let next = list;

            if (payload.eventType === 'INSERT') {
                next = [...list, payload.new as Contact];
            }

            if (payload.eventType === 'UPDATE') {
                const updated = payload.new as Contact;
                next = list.map((contact) => (contact.id === updated.id ? updated : contact));
            }

            if (payload.eventType === 'DELETE') {
                const deletedId = (payload.old as Contact).id;
                next = list.filter((contact) => contact.id !== deletedId);
            }

            return next.sort((a, b) => a.name.localeCompare(b.name));
        });
    }

    async addContact(contact: Omit<Contact, 'id'>): Promise<Contact> {
        const { data, error } = await this.supabase
            .from('contacts')
            .insert(contact)
            .select()
            .single();
        if (error) throw error;
        return data as Contact;
    }

    async updateContact(id: number, changes: Partial<Omit<Contact, 'id'>>): Promise<void> {
        const { error } = await this.supabase.from('contacts').update(changes).eq('id', id);
        if (error) throw error;
    }

    async deleteContact(id: number): Promise<void> {
        const { error } = await this.supabase.from('contacts').delete().eq('id', id);
        if (error) throw error;
    }

    ngOnDestroy(): void {
        this.channel.unsubscribe();
    }
}
