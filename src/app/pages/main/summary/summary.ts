import { Component, computed, inject, signal, AfterViewInit, OnDestroy } from '@angular/core';
import { TasksService } from '../../../core/tasks.service';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth.service';

/**
 * Dashboard summary page shown after login.
 *
 * Displays task counts by status and priority, the next urgent deadline,
 * and a time-based greeting. On narrow viewports (≤ 1234 px) a welcome
 * overlay is shown once per session via `sessionStorage`.
 */
@Component({
    selector: 'app-summary',
    imports: [DatePipe, RouterLink],
    templateUrl: './summary.html',
    styleUrl: './summary.scss',
})
export class Summary implements AfterViewInit, OnDestroy {
    private tasksService = inject(TasksService);
    private authService = inject(AuthService);

    private readonly tasks = this.tasksService.tasks;

    /** Number of tasks with status `'todo'`. */
    readonly todoCount = computed(() => this.tasks().filter((t) => t.status === 'todo').length);

    /** Number of tasks with status `'done'`. */
    readonly doneCount = computed(() => this.tasks().filter((t) => t.status === 'done').length);

    /** Number of tasks with status `'in_progress'`. */
    readonly inProgressCount = computed(
        () => this.tasks().filter((t) => t.status === 'in_progress').length,
    );

    /** Number of tasks with status `'await_feedback'`. */
    readonly awaitFeedbackCount = computed(
        () => this.tasks().filter((t) => t.status === 'await_feedback').length,
    );

    /** Number of tasks with priority `'urgent'`. */
    readonly urgentCount = computed(
        () => this.tasks().filter((t) => t.priority === 'urgent').length,
    );

    /** Total number of tasks across all statuses. */
    readonly totalCount = computed(() => this.tasks().length);

    /**
     * The nearest upcoming urgent task that is not yet done.
     * Returns `null` if no such task exists.
     */
    readonly nextUrgentDeadline = computed(() => {
        const today = new Date();
        return (
            this.tasks()
                .filter((t) => t.priority === 'urgent' && t.status !== 'done')
                .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
                .find((t) => new Date(t.due_date) >= today) ?? null
        );
    });

    /** Whether the mobile welcome overlay is currently visible. */
    showWelcome = signal(false);

    /** Time-based greeting string shown alongside the user's name. */
    readonly greeting = computed(() => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 18) return 'Good afternoon';
        return 'Good evening';
    });

    /**
     * The display name of the current user or `null` for guests / unauthenticated.
     */
    readonly currentUser = computed(() => {
        const user = this.authService.currentUser();
        if (!user || user.isGuest) return null;
        return user.name;
    });

    ngAfterViewInit(): void {
        setTimeout(() => this.evaluateWelcome());
        window.addEventListener('resize', this.onResize);
    }

    ngOnDestroy(): void {
        window.removeEventListener('resize', this.onResize);
    }

    /**
     * Re-evaluates welcome visibility on viewport resize.
     * Arrow function to preserve `this` context when used as an event listener.
     */
    private readonly onResize = (): void => {
        this.evaluateWelcome();
    };

    /**
     * Shows the welcome overlay based on viewport width and session state.
     * On narrow viewports (≤ 1234 px) the overlay is shown once per session.
     * On wide viewports it is always shown inline.
     */
    private evaluateWelcome(): void {
        if (window.innerWidth <= 1234) {
            if (!sessionStorage.getItem('welcomeShown')) {
                this.showWelcome.set(true);
                sessionStorage.setItem('welcomeShown', 'true');
                setTimeout(() => this.showWelcome.set(false), 3300);
            }
        } else {
            this.showWelcome.set(true);
        }
    }
}
