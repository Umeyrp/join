import { Service, inject, signal, type OnDestroy } from '@angular/core';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { Contact } from '../interfaces/contact';
import { Supabase } from './supabase';

type ContactChangePayload = RealtimePostgresChangesPayload<Contact>;

/**
 * Service for CRUD operations on the `contacts` table.
 *
 * Loads contacts on startup and keeps them up to date via a Realtime
 * subscription. Provides methods to add, update, and delete contacts.
 * The local list is always kept sorted alphabetically by name.
 */
@Service()
export class ContactsService implements OnDestroy {
    private supabase = inject(Supabase).client;

    /** All currently loaded contacts, sorted alphabetically by name. */
    readonly contacts = signal<Contact[]>([]);

    /** `true` while the initial load is in progress. */
    readonly isLoading = signal(true);

    /** Error message from the last load attempt or `null`. */
    readonly loadError = signal<string | null>(null);

    private readonly initialLoad = this.loadContacts();
    private readonly channel = this.subscribeToChanges();

    /**
     * Loads all contacts from Supabase and sets the `contacts` signal.
     * Sorting is handled server-side in ascending order by name.
     */
    private async loadContacts(): Promise<void> {
        try {
            const data = await this.fetchContactsFromDb();
            this.contacts.set(data);
        } catch {
            this.loadError.set('Failed to load contacts.');
        } finally {
            this.isLoading.set(false);
        }
    }

    /**
     * Executes the Supabase database query for contacts.
     *
     * @returns The sorted list of contacts
     * @throws On database error
     */
    private async fetchContactsFromDb(): Promise<Contact[]> {
        const { data, error } = await this.supabase
            .from('contacts')
            .select('id, name, email, phone')
            .order('name', { ascending: true });
        if (error) throw error;
        return data as Contact[];
    }

    /**
     * Subscribes to Realtime changes on the `contacts` table.
     * Each change is applied to the signal via `applyChange`.
     *
     * @returns The Supabase Realtime channel
     */
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

    /**
     * Applies an incoming Realtime change to the local contact list.
     * The list is re-sorted alphabetically after every change.
     *
     * @param payload - The Supabase Realtime payload containing the event type and data
     */
    private applyChange(payload: ContactChangePayload): void {
        this.contacts.update((list) => {
            const next = this.applyPayloadToList(list, payload);
            return next.sort((a, b) => a.name.localeCompare(b.name));
        });
    }

    /**
     * Computes the updated contact list based on the event type.
     *
     * @param list - The current contact list
     * @param payload - The Realtime payload
     * @returns The updated contact list (unsorted)
     */
    private applyPayloadToList(list: Contact[], payload: ContactChangePayload): Contact[] {
        if (payload.eventType === 'INSERT') {
            return [...list, payload.new as Contact];
        }
        if (payload.eventType === 'UPDATE') {
            const updated = payload.new as Contact;
            return list.map((c) => (c.id === updated.id ? updated : c));
        }
        if (payload.eventType === 'DELETE') {
            const deletedId = (payload.old as Contact).id;
            return list.filter((c) => c.id !== deletedId);
        }
        return list;
    }

    /**
     * Inserts a new contact into Supabase.
     *
     * @param contact - Contact data without `id`
     * @returns The newly created contact including the generated `id`
     * @throws On database error
     */
    async addContact(contact: Omit<Contact, 'id'>): Promise<Contact> {
        const { data, error } = await this.supabase
            .from('contacts')
            .insert(contact)
            .select()
            .single();
        if (error) throw error;
        return data as Contact;
    }

    /**
     * Updates an existing contact in Supabase.
     *
     * @param id - The ID of the contact to update
     * @param changes - The fields to change (excluding `id`)
     * @throws On database error
     */
    async updateContact(id: number, changes: Partial<Omit<Contact, 'id'>>): Promise<void> {
        const { error } = await this.supabase.from('contacts').update(changes).eq('id', id);
        if (error) throw error;
    }

    /**
     * Deletes a contact from Supabase.
     *
     * @param id - The ID of the contact to delete
     * @throws On database error
     */
    async deleteContact(id: number): Promise<void> {
        const { error } = await this.supabase.from('contacts').delete().eq('id', id);
        if (error) throw error;
    }

    /** Unsubscribes from the Realtime channel when the service is destroyed. */
    ngOnDestroy(): void {
        this.channel.unsubscribe();
    }
}
