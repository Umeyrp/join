import { Service, signal } from '@angular/core';
import { Task } from '../interfaces/task';

@Service()
export class TasksOverlayService {
    isOpen = signal(false);
    isEditMode = signal(false);
    selectedTask = signal<Task | null>(null);

    openTaskOverlay(task: Task) {
        this.isEditMode.set(false);
        this.selectedTask.set(task);
        this.isOpen.set(true);
    }

    openAddTask() {
        this.isEditMode.set(false);
        this.selectedTask.set(null);
        this.isOpen.set(true);
    }

    closeOverlay() {
        this.isOpen.set(false);
    }
}
