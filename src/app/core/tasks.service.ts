import { Service, inject, signal, type OnDestroy } from '@angular/core';
import { Status, Task } from '../interfaces/task';
import { Supabase } from './supabase';

const TASK_SELECT = '*, subtasks(*), task_contacts(contact_id, created_at)';

interface TaskRow extends Omit<Task, 'contactIds'> {
    task_contacts: { contact_id: number; created_at: string }[];
}

@Service()
export class TasksService implements OnDestroy {
    private supabase = inject(Supabase).client;

    readonly tasks = signal<Task[]>([]);

    private readonly initialLoad = this.loadTasks();
    private readonly taskChannel = this.subscribeToChanges('tasks');
    private readonly subtaskChannel = this.subscribeToChanges('subtasks');
    private readonly assignmentChannel = this.subscribeToChanges('task_contacts');

    private async loadTasks() {
        const { data, error } = await this.supabase
            .from('tasks')
            .select(TASK_SELECT)
            .order('position', { ascending: true })
            .order('id', { referencedTable: 'subtasks', ascending: true })
            .order('created_at', { referencedTable: 'task_contacts', ascending: true });

        if (error) throw error;
        this.tasks.set((data as TaskRow[]).map(this.toTask));
    }

    private toTask({ task_contacts, ...task }: TaskRow): Task {
        return { ...task, contactIds: task_contacts.map((tc) => tc.contact_id) };
    }

    private subscribeToChanges(table: string) {
        return this.supabase
            .channel(`${table}-changes`)
            .on('postgres_changes', { event: '*', schema: 'public', table }, () => this.loadTasks())
            .subscribe();
    }

    async addTask(
        task: Omit<Task, 'id' | 'created_at' | 'subtasks' | 'contactIds'>,
    ): Promise<void> {
        const { error } = await this.supabase.from('tasks').insert(task);
        if (error) throw error;
    }

    async deleteTask(id: number): Promise<void> {
        const { error } = await this.supabase.from('tasks').delete().eq('id', id);
        if (error) throw error;
    }

    async addSubtask(taskId: number, title: string): Promise<void> {
        const { error } = await this.supabase.from('subtasks').insert({ task_id: taskId, title });
        if (error) throw error;
    }

    async toggleSubtask(subtaskId: number, done: boolean): Promise<void> {
        const { error } = await this.supabase.from('subtasks').update({ done }).eq('id', subtaskId);
        if (error) throw error;
    }

    async assignContact(taskId: number, contactId: number): Promise<void> {
        const { error } = await this.supabase
            .from('task_contacts')
            .insert({ task_id: taskId, contact_id: contactId });
        if (error) throw error;
    }

    async unassignContact(taskId: number, contactId: number): Promise<void> {
        const { error } = await this.supabase
            .from('task_contacts')
            .delete()
            .eq('task_id', taskId)
            .eq('contact_id', contactId);
        if (error) throw error;
    }

    async updateTaskStatusAndPosition(id: number, status: Status, position: number): Promise<void> {
        const { error } = await this.supabase
            .from('tasks')
            .update({ status, position })
            .eq('id', id);
        if (error) throw error;
    }

    applyReorderedTasks(tasks: Task[]): void {
        this.tasks.update((current) => {
            const updatedById = new Map(tasks.map((task) => [task.id, task]));
            return current.map((task) => updatedById.get(task.id) ?? task);
        });
    }

    ngOnDestroy(): void {
        this.taskChannel.unsubscribe();
        this.subtaskChannel.unsubscribe();
        this.assignmentChannel.unsubscribe();
    }
}
