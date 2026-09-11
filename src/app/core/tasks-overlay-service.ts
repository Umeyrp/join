import { computed, inject, Service, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Task, Status } from '../interfaces/task';
import { TasksService } from './tasks.service';
import { BreakpointObserver } from '@angular/cdk/layout';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

/**
 * Service for controlling the task overlay (view, add, edit).
 *
 * On mobile viewports (max-width: 900px) the `/add-task` route is used
 * instead of the overlay. The service observes the breakpoint and automatically
 * redirects when the overlay is open in add mode and the viewport switches to mobile.
 */
@Service()
export class TasksOverlayService {
    /** Whether the overlay is currently visible. */
    isOpen = signal(false);

    /** Whether the overlay is open in edit mode. */
    isEditMode = signal(false);

    /** The ID of the currently selected task or `null` in add mode. */
    selectedTaskId = signal<number | null>(null);

    /** The default status for new tasks (passed to `/add-task` as a query param). */
    defaultStatus = signal<Status>('todo');

    /** Controls the visibility of the confirmation toast after closing. */
    showToast = signal(false);

    tasksService = inject(TasksService);
    private router = inject(Router);
    private breakpointObserver = inject(BreakpointObserver);

    private readonly MOBILE_BREAKPOINT = '(max-width: 900px)';

    /**
     * The task currently displayed in the overlay.
     * Reactively computed from `tasks` and `selectedTaskId`.
     */
    readonly selectedTask = computed(() => {
        const id = this.selectedTaskId();
        if (id === null) return null;
        return this.tasksService.tasks().find((t) => t.id === id) ?? null;
    });

    constructor() {
        this.watchBreakpointForMobileRedirect();
    }

    /**
     * Observes the mobile breakpoint and redirects to `/add-task`
     * when the overlay is in add mode on a small viewport.
     */
    private watchBreakpointForMobileRedirect(): void {
        this.breakpointObserver
            .observe([this.MOBILE_BREAKPOINT])
            .pipe(takeUntilDestroyed())
            .subscribe((result) => {
                if (result.matches && this.isOpen() && this.selectedTaskId() === null) {
                    this.redirectToAddTaskRoute();
                }
            });
    }

    /**
     * Closes the overlay and navigates to the `/add-task` route
     * with the current status as a query param.
     */
    private redirectToAddTaskRoute(): void {
        const status = this.defaultStatus();
        this.isOpen.set(false);
        this.router.navigate(['/add-task'], { queryParams: { status } });
    }

    /**
     * Opens the overlay in view mode for an existing task.
     *
     * @param taskId - The ID of the task to display
     */
    openTaskOverlay(taskId: number): void {
        this.isEditMode.set(false);
        this.selectedTaskId.set(taskId);
        this.isOpen.set(true);
    }

    /**
     * Opens the overlay in add mode.
     * On mobile viewports the `/add-task` route is used instead.
     *
     * @param status - The pre-selected status for the new task (default: `'todo'`)
     */
    openAddTask(status: Status = 'todo'): void {
        this.isEditMode.set(false);
        this.selectedTaskId.set(null);
        this.defaultStatus.set(status);

        if (this.breakpointObserver.isMatched(this.MOBILE_BREAKPOINT)) {
            this.router.navigate(['/add-task'], { queryParams: { status } });
        } else {
            this.isOpen.set(true);
        }
    }

    /**
     * Opens the overlay in edit mode for an existing task.
     *
     * @param taskId - The ID of the task to edit
     */
    openEditTask(taskId: number): void {
        this.isEditMode.set(true);
        this.selectedTaskId.set(taskId);
        this.isOpen.set(true);
    }

    /**
     * Closes the overlay and resets the selected task.
     * Optionally shows a confirmation toast for 900 ms.
     *
     * @param showToast - If `true`, briefly displays the toast
     */
    closeOverlay(showToast = false): void {
        this.isOpen.set(false);
        this.selectedTaskId.set(null);
        if (showToast) this.triggerToast();
    }

    /**
     * Displays the confirmation toast for 900 ms.
     */
    private triggerToast(): void {
        this.showToast.set(true);
        setTimeout(() => this.showToast.set(false), 900);
    }
}
