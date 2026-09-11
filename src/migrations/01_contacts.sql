-- TODO: user_id beim Insert im Service mitsenden
--   await this.supabase.client
--       .from('contacts')
--       .insert({ name, email, phone: '', user_id: session.user.id });
--   Danach sieht jeder User nur seine eigenen Kontakte (RLS greift automatisch).

create table public.contacts (
    id         bigint generated always as identity primary key,
    created_at timestamptz not null default now(),
    user_id    uuid not null references auth.users(id) on delete cascade,
    name       text not null,
    email      text not null,
    phone      text not null default ''
);

alter table public.contacts enable row level security;

-- User sieht nur seine eigenen Kontakte
create policy "contacts: select own"
on public.contacts for select
to authenticated
using (auth.uid() = user_id);

-- User darf nur Kontakte für sich selbst anlegen
create policy "contacts: insert own"
on public.contacts for insert
to authenticated
with check (auth.uid() = user_id);

-- User darf nur seine eigenen Kontakte bearbeiten
create policy "contacts: update own"
on public.contacts for update
to authenticated
using (auth.uid() = user_id);

-- User darf nur seine eigenen Kontakte löschen
create policy "contacts: delete own"
on public.contacts for delete
to authenticated
using (auth.uid() = user_id);