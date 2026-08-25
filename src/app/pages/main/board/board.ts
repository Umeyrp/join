import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TasksService } from '../../../core/tasks.service';
import { Button } from '../../../shared/components/button/button';
import { TaskCard } from './task-card/task-card';
import { TaskOverlay } from './task-overlay/task-overlay';
import { TasksOverlayService } from '../../../core/tasks-overlay-service';
import { Task } from '../../../interfaces/task';

@Component({
    selector: 'app-board',
    imports: [Button, RouterLink, TaskCard, TaskOverlay],
    templateUrl: './board.html',
    styleUrl: './board.scss',
})
export class Board {
    protected readonly tasksService = inject(TasksService);
    protected tasksOverlayService = inject(TasksOverlayService);

    protected readonly todoTasks = computed(() =>
        this.tasksService.tasks().filter((task) => task.status === 'todo'),
    );
    protected readonly inProgressTasks = computed(() =>
        this.tasksService.tasks().filter((task) => task.status === 'in_progress'),
    );
    protected readonly awaitFeedbackTasks = computed(() =>
        this.tasksService.tasks().filter((task) => task.status === 'await_feedback'),
    );
    protected readonly doneTasks = computed(() =>
        this.tasksService.tasks().filter((task) => task.status === 'done'),
    );

    protected addTestTask() {
        this.tasksService.addTask({
            title: 'Testeintrag ' + Date.now(),
            description: null,
            due_date: '2026-09-01',
            priority: 'medium',
            category: 'Technical Task',
            status: 'todo',
            position: 0,
        });
    }
}
