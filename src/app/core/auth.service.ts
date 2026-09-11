import { Injectable, inject, signal } from '@angular/core';
import { User } from '@supabase/supabase-js';
import { Supabase } from './supabase';

/**
 * Service for authentication via Supabase Auth.
 *
 * Manages the current user state as a signal and provides
 * login, signup, and logout methods.
 * Guest logins are handled via Supabase Anonymous Auth.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
    private supabase = inject(Supabase);

    /**
     * The currently logged-in user or `null` if not authenticated.
     * Updated reactively via `onAuthStateChange`.
     */
    currentUser = signal<{ name: string; isGuest: boolean } | null>(null);

    constructor() {
        this.supabase.client.auth.onAuthStateChange((_, session) => {
            this.currentUser.set(this.mapSessionToUser(session?.user ?? null));
        });
    }

    /**
     * Maps a Supabase `User` to the internal user format.
     * Returns `null` if no user is provided.
     *
     * @param user - The Supabase user or `null`
     * @returns The internal `{ name, isGuest }` object or `null`
     */
    private mapSessionToUser(user: User | null): { name: string; isGuest: boolean } | null {
        if (!user) return null;
        return {
            name: user.user_metadata?.['name'] ?? 'Guest',
            isGuest: user.is_anonymous ?? false,
        };
    }

    /**
     * Signs in a user with email and password.
     *
     * @param email - The user's email address
     * @param password - The user's password
     * @returns An error message string or `null` on success
     */
    async login(email: string, password: string): Promise<string | null> {
        const { error } = await this.supabase.client.auth.signInWithPassword({ email, password });
        return error?.message ?? null;
    }

    /**
     * Signs in an anonymous guest user.
     *
     * @returns An error message string or `null` on success
     */
    async loginAsGuest(): Promise<string | null> {
        const { error } = await this.supabase.client.auth.signInAnonymously({
            options: { data: { name: 'Guest' } },
        });
        return error?.message ?? null;
    }

    /**
     * Registers a new user and automatically creates a contact entry.
     * Signs the user out after registration because email confirmation
     * must be disabled in Supabase Auth settings.
     *
     * @param name - The display name for the new user
     * @param email - The email address
     * @param password - The chosen password
     * @returns An error message string or `null` on success
     */
    async signup(name: string, email: string, password: string): Promise<string | null> {
        const signupError = await this.signupWithSupabase(name, email, password);
        if (signupError) return signupError;

        const contactError = await this.createContactForUser(name, email);
        await this.supabase.client.auth.signOut();
        return contactError;
    }

    /**
     * Performs the actual Supabase sign-up request.
     *
     * @param name - Display name
     * @param email - Email address
     * @param password - Password
     * @returns An error message string or `null` on success
     */
    private async signupWithSupabase(
        name: string,
        email: string,
        password: string,
    ): Promise<string | null> {
        const { data, error } = await this.supabase.client.auth.signUp({
            email,
            password,
            options: { data: { name } },
        });

        if (error) return error.message;
        if (!data.session) {
            return 'Please disable email confirmation in the Supabase Auth settings.';
        }
        return null;
    }

    /**
     * Creates a contact entry for a newly registered user.
     *
     * @param name - The user's display name
     * @param email - The user's email address
     * @returns An error message string or `null` on success
     */
    private async createContactForUser(name: string, email: string): Promise<string | null> {
        const { error } = await this.supabase.client
            .from('contacts')
            .insert({ name, email, phone: '' });
        return error?.message ?? null;
    }

    /**
     * Signs out the current user and resets `currentUser` to `null`.
     */
    async logout(): Promise<void> {
        await this.supabase.client.auth.signOut();
    }

    /**
     * Checks whether an active session exists.
     *
     * @returns `true` if authenticated, otherwise `false`
     */
    async isAuthenticated(): Promise<boolean> {
        const { data } = await this.supabase.client.auth.getSession();
        return !!data.session;
    }

    /**
     * Returns the current Supabase `User` object.
     *
     * @returns The `User` or `null` on error / not logged in
     */
    async getCurrentUser() {
        const {
            data: { user },
            error,
        } = await this.supabase.client.auth.getUser();
        if (error) return null;
        return user;
    }
}
