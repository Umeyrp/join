create table public.tasks (
    id          bigint generated always as identity primary key,
    created_at  timestamptz not null default now(),
    title       text not null,
    description text not null default '',
    due_date    date not null,
    priority    text not null check (priority in ('urgent', 'medium', 'low')),
    category    text not null,
    status      text not null check (status in ('todo', 'in_progress', 'await_feedback', 'done')),
    position    int8 not null default 0
);

alter table public.tasks enable row level security;

create policy "tasks: authenticated read"
on public.tasks for select
to authenticated
using (true);

create policy "tasks: authenticated insert"
on public.tasks for insert
to authenticated
with check (true);

create policy "tasks: authenticated update"
on public.tasks for update
to authenticated
using (true);

create policy "tasks: authenticated delete"
on public.tasks for delete
to authenticated
using (true);