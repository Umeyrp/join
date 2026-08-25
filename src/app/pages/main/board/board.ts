import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TasksService } from '../../../core/tasks.service';
import { Button } from '../../../shared/components/button/button';
import { TaskCard } from './task-card/task-card';
import { TaskOverlay } from './task-overlay/task-overlay';
import { TasksOverlayService } from '../../../core/tasks-overlay-service';
import { Status, Task } from '../../../interfaces/task';
import { CdkDrag, CdkDragDrop, CdkDropList } from '@angular/cdk/drag-drop';

@Component({
    selector: 'app-board',
    imports: [Button, RouterLink, TaskCard, TaskOverlay, CdkDropList, CdkDrag],
    templateUrl: './board.html',
    styleUrl: './board.scss',
})
export class Board {
    protected readonly tasksService = inject(TasksService);
    protected tasksOverlayService = inject(TasksOverlayService);

    protected tasksByStatus(status: Status): Task[] {
        return this.tasksService.tasks().filter((task) => task.status === status);
    }

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

    drop(event: CdkDragDrop<Task[]>) {
        const task = event.previousContainer.data[event.previousIndex];
        const newStatus = event.container.id as Status;
        this.tasksService.updateTaskStatusAndPosition(task.id, newStatus, event.currentIndex);
    }
}
