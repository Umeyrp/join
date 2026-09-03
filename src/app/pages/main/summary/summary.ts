import { Component, computed, inject } from '@angular/core';
import { TasksService } from '../../../core/tasks.service';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-summary',
    imports: [DatePipe, RouterLink],
    templateUrl: './summary.html',
    styleUrl: './summary.scss',
})
export class Summary {
    private tasksService = inject(TasksService);

    readonly tasks = this.tasksService.tasks;

    readonly todoCount = computed(() => this.tasks().filter((t) => t.status === 'todo').length);
    readonly doneCount = computed(() => this.tasks().filter((t) => t.status === 'done').length);
    readonly inProgressCount = computed(
        () => this.tasks().filter((t) => t.status === 'in_progress').length,
    );
    readonly awaitFeedbackCount = computed(
        () => this.tasks().filter((t) => t.status === 'await_feedback').length,
    );
    readonly urgentCount = computed(
        () => this.tasks().filter((t) => t.priority === 'urgent').length,
    );
    readonly totalCount = computed(() => this.tasks().length);

    readonly nextUrgentDeadline = computed(() => {
        const today = new Date();
        return (
            this.tasks()
                .filter((t) => t.priority === 'urgent' && t.status !== 'done')
                .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
                .find((t) => new Date(t.due_date) >= today) ?? null
        );
    });
}
