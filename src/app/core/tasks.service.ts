import { Service, inject, signal } from '@angular/core';
import { Task } from '../interfaces/task';
import { Supabase } from './supabase';

const TASK_SELECT = '*, subtasks(*), task_contacts(contact_id)';

interface TaskRow extends Omit<Task, 'contactIds'> {
    task_contacts: { contact_id: number }[];
}

@Service()
export class TasksService {
    private supabase = inject(Supabase).client;

    readonly tasks = signal<Task[]>([]);

    private readonly initialLoad = this.loadTasks();

    private async loadTasks() {
        const { data, error } = await this.supabase
            .from('tasks')
            .select(TASK_SELECT)
            .order('position', { ascending: true });

        if (error) throw error;
        this.tasks.set((data as TaskRow[]).map(this.toTask));
    }

    private toTask({ task_contacts, ...task }: TaskRow): Task {
        return { ...task, contactIds: task_contacts.map((tc) => tc.contact_id) };
    }

    async addTask(
        task: Omit<Task, 'id' | 'created_at' | 'subtasks' | 'contactIds'>,
    ): Promise<void> {
        const { error } = await this.supabase.from('tasks').insert(task);
        if (error) throw error;
        await this.loadTasks();
    }

    async deleteTask(id: number): Promise<void> {
        const { error } = await this.supabase.from('tasks').delete().eq('id', id);
        if (error) throw error;
        await this.loadTasks();
    }
}
