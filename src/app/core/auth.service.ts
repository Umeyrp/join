import { Injectable, inject, signal } from '@angular/core';
import { Supabase } from './supabase';

@Injectable({ providedIn: 'root' })
export class AuthService {
    private supabase = inject(Supabase);
    currentUser = signal<{ name: string; isGuest: boolean } | null>(null);

    constructor() {
        this.supabase.client.auth.onAuthStateChange((_, session) => {
            const user = session?.user;
            if (!user) {
                this.currentUser.set(null);
                return;
            }
            const name = user.user_metadata?.['name'] ?? 'Guest';
            const isGuest = user.is_anonymous ?? false;
            this.currentUser.set({ name, isGuest });
        });
    }

    async login(email: string, password: string) {
        const { error } = await this.supabase.client.auth.signInWithPassword({ email, password });
        return error?.message ?? null;
    }

    async loginAsGuest() {
        const { error } = await this.supabase.client.auth.signInAnonymously({
            options: { data: { name: 'Guest' } },
        });
        return error?.message ?? null;
    }

    async signup(name: string, email: string, password: string) {
        const { data, error } = await this.supabase.client.auth.signUp({
            email,
            password,
            options: { data: { name } },
        });

        if (error) return error.message;
        if (!data.session) {
            return 'Bitte deaktiviere die E-Mail-Bestätigung in den Supabase Auth-Einstellungen.';
        }

        const { error: contactError } = await this.supabase.client
            .from('contacts')
            .insert({ name, email, phone: '' });

        await this.supabase.client.auth.signOut();

        return contactError?.message ?? null;
    }

    async logout() {
        await this.supabase.client.auth.signOut();
    }

    async isAuthenticated() {
        const { data } = await this.supabase.client.auth.getSession();
        return !!data.session;
    }

    async getCurrentUser() {
        const {
            data: { user },
            error,
        } = await this.supabase.client.auth.getUser();
        if (error) return null;

        return user;
    }
}
