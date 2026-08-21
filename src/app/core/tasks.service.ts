import { Service, inject, signal } from '@angular/core';
import { Task } from '../interfaces/task';
import { Supabase } from './supabase';

@Service()
export class TasksService {
    private supabase = inject(Supabase).client;

    readonly tasks = signal<Task[]>([]);

    private readonly initialLoad = this.loadTasks();

    private async loadTasks() {
        const { data, error } = await this.supabase
            .from('tasks')
            .select(
                'id, created_at, title, description, due_date, priority, category, status, position',
            )
            .order('position', { ascending: true });

        if (error) throw error;
        this.tasks.set(data as Task[]);
    }
}
