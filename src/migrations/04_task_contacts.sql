create table public.task_contacts (
    created_at  timestamptz not null default now(),
    task_id     bigint not null references public.tasks(id) on delete cascade,
    contact_id  bigint not null references public.contacts(id) on delete cascade,
    primary key (task_id, contact_id)
);

alter table public.task_contacts enable row level security;

create policy "task_contacts: authenticated read"
on public.task_contacts for select
to authenticated
using (true);

create policy "task_contacts: authenticated insert"
on public.task_contacts for insert
to authenticated
with check (true);

create policy "task_contacts: authenticated update"
on public.task_contacts for update
to authenticated
using (true);

create policy "task_contacts: authenticated delete"
on public.task_contacts for delete
to authenticated
using (true);