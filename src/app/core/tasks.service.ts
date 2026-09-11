import { Service, inject, signal, type OnDestroy } from '@angular/core';
import { Status, Task } from '../interfaces/task';
import { Supabase } from './supabase';

const TASK_SELECT = '*, subtasks(*), task_contacts(contact_id, created_at)';

interface TaskRow extends Omit<Task, 'contactIds'> {
    task_contacts: { contact_id: number; created_at: string }[];
}

/**
 * Service for CRUD operations on tasks, subtasks, and contact assignments.
 *
 * Loads tasks on startup and keeps them up to date via Realtime subscriptions
 * on three tables: `tasks`, `subtasks`, and `task_contacts`.
 * Optimistic updates are available via `applyOptimisticReorder`.
 */
@Service()
export class TasksService implements OnDestroy {
    private supabase = inject(Supabase).client;

    /** All currently loaded tasks including subtasks and contact IDs. */
    readonly tasks = signal<Task[]>([]);

    private readonly initialLoad = this.loadTasks();
    private readonly taskChannel = this.subscribeToChanges('tasks');
    private readonly subtaskChannel = this.subscribeToChanges('subtasks');
    private readonly assignmentChannel = this.subscribeToChanges('task_contacts');

    /**
     * Loads all tasks with subtasks and contact assignments from Supabase.
     * Called automatically on startup and after every Realtime change.
     */
    private async loadTasks(): Promise<void> {
        const { data, error } = await this.supabase
            .from('tasks')
            .select(TASK_SELECT)
            .order('position', { ascending: true })
            .order('id', { referencedTable: 'subtasks', ascending: true })
            .order('created_at', { referencedTable: 'task_contacts', ascending: true });

        if (error) throw error;
        this.tasks.set((data as TaskRow[]).map(this.toTask));
    }

    /**
     * Transforms a database row into the internal `Task` format.
     * Flattens `task_contacts` into an array of `contactIds`.
     *
     * @param taskRow - The raw data from Supabase
     * @returns A `Task` object with `contactIds`
     */
    private toTask({ task_contacts, ...task }: TaskRow): Task {
        return { ...task, contactIds: task_contacts.map((tc) => tc.contact_id) };
    }

    /**
     * Subscribes to Realtime changes on a table and triggers `loadTasks`.
     *
     * @param table - Name of the table to observe
     * @returns The Supabase Realtime channel
     */
    private subscribeToChanges(table: string) {
        return this.supabase
            .channel(`${table}-changes`)
            .on('postgres_changes', { event: '*', schema: 'public', table }, () => this.loadTasks())
            .subscribe();
    }

    /**
     * Creates a new task in Supabase.
     *
     * @param task - Task data without auto-generated fields
     * @throws On database error
     */
    async addTask(
        task: Omit<Task, 'id' | 'created_at' | 'subtasks' | 'contactIds'>,
    ): Promise<void> {
        const { error } = await this.supabase.from('tasks').insert(task);
        if (error) throw error;
    }

    /**
     * Deletes a task from Supabase. Subtasks are removed via cascade.
     *
     * @param id - The ID of the task to delete
     * @throws On database error
     */
    async deleteTask(id: number): Promise<void> {
        const { error } = await this.supabase.from('tasks').delete().eq('id', id);
        if (error) throw error;
    }

    /**
     * Adds a subtask to a task.
     *
     * @param taskId - The ID of the parent task
     * @param title - The title of the new subtask
     * @throws On database error
     */
    async addSubtask(taskId: number, title: string): Promise<void> {
        const { error } = await this.supabase.from('subtasks').insert({ task_id: taskId, title });
        if (error) throw error;
    }

    /**
     * Sets the `done` state of a subtask.
     *
     * @param subtaskId - The ID of the subtask
     * @param done - The new state
     * @throws On database error
     */
    async toggleSubtask(subtaskId: number, done: boolean): Promise<void> {
        const { error } = await this.supabase.from('subtasks').update({ done }).eq('id', subtaskId);
        if (error) throw error;
    }

    /**
     * Assigns a contact to a task (inserts into `task_contacts`).
     *
     * @param taskId - The ID of the task
     * @param contactId - The ID of the contact
     * @throws On database error
     */
    async assignContact(taskId: number, contactId: number): Promise<void> {
        const { error } = await this.supabase
            .from('task_contacts')
            .insert({ task_id: taskId, contact_id: contactId });
        if (error) throw error;
    }

    /**
     * Removes a contact assignment from a task.
     *
     * @param taskId - The ID of the task
     * @param contactId - The ID of the contact
     * @throws On database error
     */
    async unassignContact(taskId: number, contactId: number): Promise<void> {
        const { error } = await this.supabase
            .from('task_contacts')
            .delete()
            .eq('task_id', taskId)
            .eq('contact_id', contactId);
        if (error) throw error;
    }

    /**
     * Updates the status and position of a task (used during drag and drop).
     *
     * @param id - The ID of the task
     * @param status - The new status
     * @param position - The new position within the column
     * @throws On database error
     */
    async updateTaskStatusAndPosition(id: number, status: Status, position: number): Promise<void> {
        const { error } = await this.supabase
            .from('tasks')
            .update({ status, position })
            .eq('id', id);
        if (error) throw error;
    }

    /**
     * Optimistically updates the `tasks` signal for reorder operations.
     * Only the provided tasks are updated; all others remain unchanged.
     *
     * @param tasks - The reordered tasks with updated `position` values
     */
    applyOptimisticReorder(tasks: Task[]): void {
        this.tasks.update((current) => {
            const updatedById = new Map(tasks.map((t) => [t.id, t]));
            return current.map((t) => updatedById.get(t.id) ?? t);
        });
    }

    /**
     * Updates the metadata of a task (title, description, priority, etc.).
     *
     * @param id - The ID of the task
     * @param changes - The fields to change
     * @throws On database error
     */
    async updateTask(
        id: number,
        changes: Partial<Omit<Task, 'id' | 'created_at' | 'subtasks' | 'contactIds'>>,
    ): Promise<void> {
        const { error } = await this.supabase.from('tasks').update(changes).eq('id', id);
        if (error) throw error;
    }

    /**
     * Deletes a subtask.
     *
     * @param subtaskId - The ID of the subtask to delete
     * @throws On database error
     */
    async deleteSubtask(subtaskId: number): Promise<void> {
        const { error } = await this.supabase.from('subtasks').delete().eq('id', subtaskId);
        if (error) throw error;
    }

    /**
     * Updates the title of a subtask.
     *
     * @param subtaskId - The ID of the subtask
     * @param title - The new title
     * @throws On database error
     */
    async updateSubtaskTitle(subtaskId: number, title: string): Promise<void> {
        const { error } = await this.supabase
            .from('subtasks')
            .update({ title })
            .eq('id', subtaskId);
        if (error) throw error;
    }

    /**
     * Synchronises the contact assignments of a task with a new ID list.
     * Computes the delta (to add vs. to remove) and runs all operations in parallel.
     *
     * @param taskId - The ID of the task
     * @param contactIds - The complete new list of contact IDs
     */
    async syncTaskContacts(taskId: number, contactIds: number[]): Promise<void> {
        const current = this.getCurrentContactIds(taskId);
        const toAdd = contactIds.filter((id) => !current.includes(id));
        const toRemove = current.filter((id) => !contactIds.includes(id));

        await this.applyContactChanges(taskId, toAdd, toRemove);
    }

    /**
     * Returns the current contact IDs of a task from the local signal.
     *
     * @param taskId - The ID of the task
     * @returns Array of currently assigned contact IDs
     */
    private getCurrentContactIds(taskId: number): number[] {
        return this.tasks().find((t) => t.id === taskId)?.contactIds ?? [];
    }

    /**
     * Runs assign and unassign operations in parallel.
     *
     * @param taskId - The ID of the task
     * @param toAdd - Contact IDs to assign
     * @param toRemove - Contact IDs to unassign
     */
    private async applyContactChanges(
        taskId: number,
        toAdd: number[],
        toRemove: number[],
    ): Promise<void> {
        await Promise.all([
            ...toAdd.map((id) => this.assignContact(taskId, id)),
            ...toRemove.map((id) => this.unassignContact(taskId, id)),
        ]);
    }

    /** Unsubscribes from all three Realtime channels when the service is destroyed. */
    ngOnDestroy(): void {
        this.taskChannel.unsubscribe();
        this.subtaskChannel.unsubscribe();
        this.assignmentChannel.unsubscribe();
    }
}
