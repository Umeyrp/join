import { computed, inject, Service, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Task, Status } from '../interfaces/task';
import { TasksService } from './tasks.service';
import { BreakpointObserver } from '@angular/cdk/layout'; // NEU
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'; // NEU

@Service()
export class TasksOverlayService {
    isOpen = signal(false);
    isEditMode = signal(false);
    selectedTaskId = signal<number | null>(null);
    defaultStatus = signal<Status>('todo');
    tasksService = inject(TasksService);
    private router = inject(Router);
    private breakpointObserver = inject(BreakpointObserver);
    showToast = signal(false);

    private readonly MOBILE_BREAKPOINT = '(max-width: 900px)';

    readonly selectedTask = computed(() => {
        const id = this.selectedTaskId();
        if (id === null) return null;
        return this.tasksService.tasks().find((t) => t.id === id) ?? null;
    });

    constructor() {
        this.breakpointObserver
            .observe([this.MOBILE_BREAKPOINT])
            .pipe(takeUntilDestroyed())
            .subscribe((result) => {
                if (result.matches && this.isOpen() && this.selectedTaskId() === null) {
                    const status = this.defaultStatus();
                    this.isOpen.set(false);
                    this.router.navigate(['/add-task'], { queryParams: { status } });
                }
            });
    }

    openTaskOverlay(taskId: number) {
        this.isEditMode.set(false);
        this.selectedTaskId.set(taskId);
        this.isOpen.set(true);
    }

    openAddTask(status: Status = 'todo') {
        this.isEditMode.set(false);
        this.selectedTaskId.set(null);
        this.defaultStatus.set(status);

        if (this.breakpointObserver.isMatched(this.MOBILE_BREAKPOINT)) {
            this.router.navigate(['/add-task'], { queryParams: { status } });
        } else {
            this.isOpen.set(true);
        }
    }

    openEditTask(taskId: number) {
        this.isEditMode.set(true);
        this.selectedTaskId.set(taskId);
        this.isOpen.set(true);
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
