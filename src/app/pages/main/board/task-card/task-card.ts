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
}
