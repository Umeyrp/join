create table public.subtasks (
    id         bigint generated always as identity primary key,
    created_at timestamptz not null default now(),
    task_id    bigint not null references public.tasks(id) on delete cascade,
    title      text not null,
    done       boolean not null default false
);

alter table public.subtasks enable row level security;

create policy "subtasks: authenticated read"
on public.subtasks for select
to authenticated
using (true);

create policy "subtasks: authenticated insert"
on public.subtasks for insert
to authenticated
with check (true);

create policy "subtasks: authenticated update"
on public.subtasks for update
to authenticated
using (true);

create policy "subtasks: authenticated delete"
on public.subtasks for delete
to authenticated
using (true);