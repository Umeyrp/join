import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TasksService } from '../../../core/tasks.service';
import { Button } from '../../../shared/components/button/button';
import { TaskCard } from './task-card/task-card';
import { TaskOverlay } from './task-overlay/task-overlay';
import { TasksOverlayService } from '../../../core/tasks-overlay-service';
import { Status, Task } from '../../../interfaces/task';
import { CdkDrag, CdkDragDrop, CdkDropList, moveItemInArray } from '@angular/cdk/drag-drop';

@Component({
    selector: 'app-board',
    imports: [Button, TaskCard, TaskOverlay, CdkDropList, CdkDrag],
    templateUrl: './board.html',
    styleUrl: './board.scss',
})
export class Board {
    protected readonly tasksService = inject(TasksService);
    protected tasksOverlayService = inject(TasksOverlayService);

    protected tasksByStatus(status: Status): Task[] {
        return this.tasksService
            .tasks()
            .filter((task) => task.status === status)
            .sort((a, b) => a.position - b.position);
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

    async drop(event: CdkDragDrop<Task[]>) {
        const task = event.previousContainer.data[event.previousIndex];
        const newStatus = event.container.id as Status;

        const targetTasks = [...event.container.data];
        if (event.previousContainer === event.container) {
            moveItemInArray(targetTasks, event.previousIndex, event.currentIndex);
        } else {
            targetTasks.splice(event.currentIndex, 0, task);
        }

        const reorderedTasks = targetTasks.map((columnTask, index) => ({
            ...columnTask,
            status: newStatus,
            position: index,
        }));

        const previousTasks = this.tasksService.tasks();
        this.tasksService.applyOptimisticReorder(reorderedTasks);

        try {
            await Promise.all(
                reorderedTasks.map((columnTask) =>
                    this.tasksService.updateTaskStatusAndPosition(
                        columnTask.id,
                        columnTask.status,
                        columnTask.position,
                    ),
                ),
            );
        } catch {
            this.tasksService.applyOptimisticReorder(previousTasks);
        }
    }

    openAddTask() {
        this.tasksOverlayService.openAddTask();
    }
}
