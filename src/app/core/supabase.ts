import { Service } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

/**
 * Wrapper service for the Supabase client.
 *
 * Creates a single `SupabaseClient` instance using the credentials
 * from the environment and exposes it application-wide.
 * All services that need database access inject this service.
 */
@Service()
export class Supabase {
    /** Initialized Supabase client using the URL and anon key from the environment. */
    readonly client: SupabaseClient = createClient(
        environment.supabaseUrl,
        environment.supabaseAnonKey,
    );
}
