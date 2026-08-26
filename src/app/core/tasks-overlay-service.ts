import { computed, inject, Service, signal } from '@angular/core';
import { Task, Status } from '../interfaces/task';
import { TasksService } from './tasks.service';

@Service()
export class TasksOverlayService {
    isOpen = signal(false);
    isEditMode = signal(false);
    private selectedTaskId = signal<number | null>(null);
    defaultStatus = signal<Status>('todo');
    tasksService = inject(TasksService);

    readonly selectedTask = computed(() => {
        const id = this.selectedTaskId();
        if (id === null) return null;
        return this.tasksService.tasks().find((t) => t.id === id) ?? null;
    });

    openTaskOverlay(taskId: number) {
        this.isEditMode.set(false);
        this.selectedTaskId.set(taskId);
        this.isOpen.set(true);
    }

    openAddTask(status: Status = 'todo') {
        this.isEditMode.set(false);
        this.selectedTaskId.set(null);
        this.defaultStatus.set(status);
        this.isOpen.set(true);
    }

    closeOverlay() {
        this.isOpen.set(false);
        this.selectedTaskId.set(null);
    }
}
