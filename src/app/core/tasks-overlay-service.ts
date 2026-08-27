import { computed, inject, Service, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Task, Status } from '../interfaces/task';
import { TasksService } from './tasks.service';

@Service()
export class TasksOverlayService {
    isOpen = signal(false);
    isEditMode = signal(false);
    private selectedTaskId = signal<number | null>(null);
    defaultStatus = signal<Status>('todo');
    tasksService = inject(TasksService);
    private router = inject(Router);
    showToast = signal(false);

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

        if (window.innerWidth <= 900) {
            this.router.navigate(['/add-task'], { queryParams: { status } });
        } else {
            this.isOpen.set(true);
        }
    }

    closeOverlay(showToast = false) {
        this.isOpen.set(false);
        this.selectedTaskId.set(null);
        if (showToast) {
            this.showToast.set(true);
            setTimeout(() => this.showToast.set(false), 900);
        }
    }
}
