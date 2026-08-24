import { Component, computed, input } from '@angular/core';
import { Task } from '../../../../interfaces/task';

@Component({
    selector: 'app-task-card',
    imports: [],
    templateUrl: './task-card.html',
    styleUrl: './task-card.scss',
})
export class TaskCard {
    task = input.required<Task>();

    protected readonly categoryClass = computed(() =>
        this.task().category === 'User Story' ? 'user-story' : 'technical-task',
    );

    protected readonly subtaskProgress = computed(() => {
        const subtasks = this.task().subtasks;
        if (subtasks.length === 0) return null;

        const done = subtasks.filter((subtask) => subtask.done).length;
        const percent = (done / subtasks.length) * 100;
        const color = percent < 34 ? '#ff3d00' : percent < 67 ? '#ffa800' : '#7ae229';

        return { done, total: subtasks.length, percent: Math.max(percent, 5), color };
    });
}
