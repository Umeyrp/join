import { Component, computed, inject, input, output, signal } from '@angular/core';
import { Status, Task } from '../../../../interfaces/task';
import { getAvatarColor, getInitials } from '../../../../interfaces/contact';
import { TasksDisplayService } from '../../../../core/tasks-display.service';

/**
 * Card component representing a single task in the Kanban board.
 *
 * Displays the task's category badge, title, description excerpt,
 * subtask progress bar, and up to four assigned contact avatars.
 * On mobile a move-menu lets users transfer the task to another column
 * without drag-and-drop.
 */
@Component({
    selector: 'app-task-card',
    imports: [],
    templateUrl: './task-card.html',
    styleUrl: './task-card.scss',
})
export class TaskCard {
    /** The task to display. */
    task = input.required<Task>();

    /** Emitted when the user selects a new target status from the move-menu. */
    move = output<Status>();

    private readonly tasksDisplayService = inject(TasksDisplayService);

    protected readonly getAvatarColor = getAvatarColor;
    protected readonly getInitials = getInitials;

    private readonly statusLabels: Record<Status, string> = {
        todo: 'To do',
        in_progress: 'In progress',
        await_feedback: 'Await feedback',
        done: 'Done',
    };

    private readonly statusOrder: Status[] = ['todo', 'in_progress', 'await_feedback', 'done'];

    /**
     * The move options shown in the mobile move-menu.
     * Excludes the task's current status and annotates each option
     * with a direction (`'up'` or `'down'`) relative to the current column.
     */
    protected readonly moveOptions = computed(() => {
        const currentStatus = this.task().status;
        const currentIndex = this.statusOrder.indexOf(currentStatus);

        return this.statusOrder
            .filter((s) => s !== currentStatus)
            .map((s) => ({
                status: s,
                label: this.statusLabels[s],
                direction: this.statusOrder.indexOf(s) < currentIndex ? 'up' : ('down' as const),
            }));
    });

    /** Animation state of the mobile move-menu. */
    protected readonly menuState = signal<'closed' | 'open' | 'closing'>('closed');

    /**
     * Opens the move-menu and stops the click from bubbling to the card.
     *
     * @param event - The originating click event
     */
    protected openMoveMenu(event: Event): void {
        event.stopPropagation();
        this.menuState.set('open');
    }

    /**
     * Begins the closing animation of the move-menu.
     *
     * @param event - Optional event to stop from propagating
     */
    protected closeMoveMenu(event?: Event): void {
        event?.stopPropagation();
        if (this.menuState() === 'open') this.menuState.set('closing');
    }

    /** Finalises the close animation by setting the state to `'closed'`. */
    protected onMoveMenuAnimationEnd(): void {
        if (this.menuState() === 'closing') this.menuState.set('closed');
    }

    /**
     * Selects a target status, starts the close animation, and emits `move`.
     *
     * @param status - The target column status
     * @param event - The click event (stopped to prevent card opening)
     */
    protected selectStatus(status: Status, event: Event): void {
        event.stopPropagation();
        this.menuState.set('closing');
        this.move.emit(status);
    }

    /** CSS class for the category badge (`'user-story'` or `'technical-task'`). */
    protected readonly categoryClass = computed(() =>
        this.tasksDisplayService.categoryClass(this.task()),
    );

    /** Full list of resolved contact objects assigned to this task. */
    protected readonly assignedContacts = computed(() =>
        this.tasksDisplayService.assignedContacts(this.task()),
    );

    private readonly maxVisibleAvatars = 4;

    /** The first four assigned contacts shown as avatars. */
    protected readonly visibleContacts = computed(() =>
        this.assignedContacts().slice(0, this.maxVisibleAvatars),
    );

    /**
     * The number of assigned contacts beyond the visible avatar limit.
     * Shown as `+N` overflow indicator.
     */
    protected readonly overflowCount = computed(() =>
        Math.max(0, this.assignedContacts().length - this.maxVisibleAvatars),
    );

    /** Subtask progress data for the progress bar, or `null` if no subtasks exist. */
    protected readonly subtaskProgress = computed(() =>
        this.tasksDisplayService.subtaskProgress(this.task()),
    );
}
