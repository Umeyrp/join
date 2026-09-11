import { Service, inject } from '@angular/core';
import { Task } from '../interfaces/task';
import { Contact } from '../interfaces/contact';
import { ContactsService } from './contacts.service';

/**
 * Service for pure display logic related to tasks.
 *
 * Computes CSS classes, resolved contact objects, and progress bar data
 * for task components. Contains no side effects or database access.
 */
@Service()
export class TasksDisplayService {
    private readonly contactsService = inject(ContactsService);

    /**
     * Returns the CSS class for the task category badge.
     *
     * @param task - The task whose category is evaluated
     * @returns `'user-story'` or `'technical-task'`
     */
    categoryClass(task: Task): string {
        return task.category === 'User Story' ? 'user-story' : 'technical-task';
    }

    /**
     * Resolves the `contactIds` of a task to full `Contact` objects.
     * IDs without a matching contact (e.g. after deletion) are filtered out.
     *
     * @param task - The task whose contacts should be resolved
     * @returns Array of found `Contact` objects
     */
    assignedContacts(task: Task): Contact[] {
        return task.contactIds
            .map((id) => this.contactsService.contacts().find((c) => c.id === id))
            .filter((c): c is Contact => c !== undefined);
    }

    /**
     * Calculates the progress bar state for a task's subtasks.
     *
     * @param task - The task whose subtask progress is calculated
     * @returns An object with `done`, `total`, `percent`, and `color`,
     *          or `null` if the task has no subtasks
     */
    subtaskProgress(
        task: Task,
    ): { done: number; total: number; percent: number; color: string } | null {
        const subtasks = task.subtasks;
        if (subtasks.length === 0) return null;

        const done = subtasks.filter((s) => s.done).length;
        const percent = (done / subtasks.length) * 100;

        return {
            done,
            total: subtasks.length,
            percent: Math.max(percent, 5),
            color: this.progressColor(percent),
        };
    }

    /**
     * Returns the progress bar color based on the percentage value.
     *
     * @param percent - Value between 0 and 100
     * @returns Hex color: red below 34 %, orange below 67 %, green at 67 % and above
     */
    private progressColor(percent: number): string {
        if (percent < 34) return '#ff3d00';
        if (percent < 67) return '#ffa800';
        return '#7ae229';
    }
}
