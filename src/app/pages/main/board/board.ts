import { Component, computed, inject, signal } from '@angular/core';
import { ContactsService } from '../../../core/contacts.service';
import { Contact, getAvatarColor, getInitials } from '../../../interfaces/contact';
import { TasksService } from '../../../core/tasks.service';
import { Button } from '../../../shared/components/button/button';
import { TaskCard } from './task-card/task-card';
import { TaskOverlay } from './task-overlay/task-overlay';
import { TasksOverlayService } from '../../../core/tasks-overlay-service';
import { TasksDisplayService } from '../../../core/tasks-display.service';
import { Status, Task } from '../../../interfaces/task';
import { CdkDrag, CdkDragDrop, CdkDropList, moveItemInArray } from '@angular/cdk/drag-drop';

/**
 * Kanban board page.
 *
 * Renders four status columns (`todo`, `in_progress`, `await_feedback`, `done`).
 * Tasks can be filtered by a search term (title/description) or by assignee.
 * Drag-and-drop reordering is handled via Angular CDK with optimistic updates —
 * the UI updates immediately and rolls back if the Supabase call fails.
 */
@Component({
    selector: 'app-board',
    imports: [Button, TaskCard, TaskOverlay, CdkDropList, CdkDrag],
    templateUrl: './board.html',
    styleUrl: './board.scss',
})
export class Board {
    protected readonly tasksService = inject(TasksService);
    protected readonly tasksOverlayService = inject(TasksOverlayService);
    private readonly contactsService = inject(ContactsService);
    private readonly tasksDisplayService = inject(TasksDisplayService);

    /** Current value of the board search input. */
    protected readonly searchTerm = signal('');

    /** The contact used to filter tasks by assignee, or `null` when inactive. */
    protected readonly assigneeFilter = signal<Contact | null>(null);

    /** `true` when the viewport is ≤ 900 px wide (touch/mobile layout). */
    protected readonly isTouchLayout = signal(window.innerWidth <= 900);

    protected readonly getAvatarColor = getAvatarColor;
    protected readonly getInitials = getInitials;

    private readonly statuses: Status[] = ['todo', 'in_progress', 'await_feedback', 'done'];

    /**
     * Contact name suggestions for the assignee autocomplete.
     * Returns an empty array when the search term is blank or an assignee is already set.
     */
    protected readonly nameSuggestions = computed(() => {
        const term = this.searchTerm().trim().toLowerCase();
        if (!term || this.assigneeFilter()) return [];
        return this.contactsService.contacts().filter((c) => c.name.toLowerCase().includes(term));
    });

    /**
     * `true` when a search term is active but yields no matching tasks or contacts.
     */
    protected readonly hasNoSearchResults = computed(() => {
        const term = this.searchTerm().trim();
        if (!term) return false;
        const noTasks = this.statuses.every((s) => this.tasksByStatus(s).length === 0);
        return noTasks && this.nameSuggestions().length === 0;
    });

    /**
     * Sets the assignee filter to the given contact and clears the search term.
     *
     * @param contact - The contact to filter by
     */
    protected selectAssignee(contact: Contact): void {
        this.assigneeFilter.set(contact);
        this.searchTerm.set('');
    }

    /** Clears the active assignee filter. */
    protected clearAssigneeFilter(): void {
        this.assigneeFilter.set(null);
    }

    /**
     * Returns the filtered and sorted task list for a given status column.
     * Applies both the text search and the assignee filter.
     *
     * @param status - The Kanban column status to filter by
     * @returns Tasks matching all active filters, sorted by `position`
     */
    protected tasksByStatus(status: Status): Task[] {
        const term = this.searchTerm().trim().toLowerCase();
        const assignee = this.assigneeFilter();

        return this.tasksService
            .tasks()
            .filter((t) => t.status === status)
            .filter((t) => this.matchesSearch(t, term))
            .filter((t) => this.matchesAssignee(t, assignee))
            .sort((a, b) => a.position - b.position);
    }

    /**
     * Returns `true` if the task is assigned to the given contact.
     * Always returns `true` when no assignee filter is active.
     *
     * @param task - The task to check
     * @param assignee - The required assignee or `null`
     */
    private matchesAssignee(task: Task, assignee: Contact | null): boolean {
        if (!assignee) return true;
        return this.tasksDisplayService.assignedContacts(task).some((c) => c.id === assignee.id);
    }

    /**
     * Returns `true` if the task's title or description contains the search term.
     * Always returns `true` when the term is empty.
     *
     * @param task - The task to check
     * @param term - The lowercased search term
     */
    private matchesSearch(task: Task, term: string): boolean {
        if (!term) return true;
        return (
            task.title.toLowerCase().includes(term) ||
            (task.description ?? '').toLowerCase().includes(term)
        );
    }

    /**
     * Handles a CDK drag-and-drop event.
     * Applies an optimistic reorder immediately and persists all affected positions
     * to Supabase in parallel. Rolls back to the previous state on error.
     *
     * @param event - The CDK drop event containing source, target, and indices
     */
    async drop(event: CdkDragDrop<Task[]>): Promise<void> {
        const task = event.previousContainer.data[event.previousIndex];
        const newStatus = event.container.id as Status;
        const reorderedTasks = this.buildReorderedTasks(event, task, newStatus);
        const previousTasks = this.tasksService.tasks();
        this.tasksService.applyOptimisticReorder(reorderedTasks);
        await this.persistReorder(reorderedTasks, previousTasks);
    }

    /**
     * Persists reordered tasks to Supabase in parallel and rolls back on error.
     *
     * @param reorderedTasks - Tasks with updated status and position
     * @param previousTasks - Snapshot to restore on failure
     */
    private async persistReorder(reorderedTasks: Task[], previousTasks: Task[]): Promise<void> {
        try {
            await Promise.all(
                reorderedTasks.map((t) =>
                    this.tasksService.updateTaskStatusAndPosition(t.id, t.status, t.position),
                ),
            );
        } catch {
            this.tasksService.applyOptimisticReorder(previousTasks);
        }
    }

    /**
     * Computes the reordered task list after a drop event.
     *
     * @param event - The CDK drop event
     * @param task - The dragged task
     * @param newStatus - The target column status
     * @returns Array of tasks with updated `status` and `position` values
     */
    private buildReorderedTasks(event: CdkDragDrop<Task[]>, task: Task, newStatus: Status): Task[] {
        const targetTasks = [...event.container.data];
        if (event.previousContainer === event.container) {
            moveItemInArray(targetTasks, event.previousIndex, event.currentIndex);
        } else {
            targetTasks.splice(event.currentIndex, 0, task);
        }
        return targetTasks.map((t, index) => ({ ...t, status: newStatus, position: index }));
    }

    /**
     * Moves a task to a new status column via the mobile move-menu (non-drag).
     * Appends the task at the end of the target column and applies an optimistic update.
     * Rolls back on error.
     *
     * @param task - The task to move
     * @param newStatus - The target column status
     */
    async onMoveTask(task: Task, newStatus: Status): Promise<void> {
        const position = this.tasksByStatus(newStatus).length;
        const previousTasks = this.tasksService.tasks();
        const updatedTasks = previousTasks.map((t) =>
            t.id === task.id ? { ...t, status: newStatus, position } : t,
        );
        this.tasksService.applyOptimisticReorder(updatedTasks);
        await this.persistSingleMove(task.id, newStatus, position, previousTasks);
    }

    /**
     * Persists a single task's status and position change and rolls back on error.
     *
     * @param taskId - ID of the moved task
     * @param newStatus - Target column status
     * @param position - Position within the target column
     * @param previousTasks - Snapshot to restore on failure
     */
    private async persistSingleMove(
        taskId: number,
        newStatus: Status,
        position: number,
        previousTasks: Task[],
    ): Promise<void> {
        try {
            await this.tasksService.updateTaskStatusAndPosition(taskId, newStatus, position);
        } catch {
            this.tasksService.applyOptimisticReorder(previousTasks);
        }
    }

    /** Opens the add-task overlay (or navigates to `/add-task` on mobile). */
    openAddTask(): void {
        this.tasksOverlayService.openAddTask();
    }
}
