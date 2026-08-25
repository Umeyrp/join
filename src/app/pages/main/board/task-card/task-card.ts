import { Component, computed, inject, input } from '@angular/core';
import { Task } from '../../../../interfaces/task';
import { getAvatarColor, getInitials } from '../../../../interfaces/contact';
import { TasksDisplayService } from '../../../../core/tasks-display.service';

@Component({
    selector: 'app-task-card',
    imports: [],
    templateUrl: './task-card.html',
    styleUrl: './task-card.scss',
})
export class TaskCard {
    task = input.required<Task>();

    private readonly tasksDisplayService = inject(TasksDisplayService);

    protected readonly getAvatarColor = getAvatarColor;
    protected readonly getInitials = getInitials;

    protected readonly categoryClass = computed(() =>
        this.task().category === 'User Story' ? 'user-story' : 'technical-task',
    );

    protected readonly assignedContacts = computed(() =>
        this.tasksDisplayService.assignedContacts(this.task()),
    );

    protected readonly subtaskProgress = computed(() =>
        this.tasksDisplayService.subtaskProgress(this.task()),
    );
}
