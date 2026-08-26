import { Service, signal } from '@angular/core';
import { Task, Status } from '../interfaces/task';

@Service()
export class TasksOverlayService {
    isOpen = signal(false);
    isEditMode = signal(false);
    selectedTask = signal<Task | null>(null);
    defaultStatus = signal<Status>('todo');

    openTaskOverlay(task: Task) {
        this.isEditMode.set(false);
        this.selectedTask.set(task);
        this.isOpen.set(true);
    }

    openAddTask(status: Status = 'todo') {
        this.isEditMode.set(false);
        this.selectedTask.set(null);
        this.defaultStatus.set(status);
        this.isOpen.set(true);
    }

    closeOverlay() {
        this.isOpen.set(false);
    }
}
