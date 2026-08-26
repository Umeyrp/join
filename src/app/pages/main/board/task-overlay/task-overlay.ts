import {
    Component,
    computed,
    effect,
    ElementRef,
    inject,
    input,
    output,
    signal,
    viewChild,
} from '@angular/core';
import { Task } from '../../../../interfaces/task';
import { TasksDisplayService } from '../../../../core/tasks-display.service';
import { getAvatarColor, getInitials } from '../../../../interfaces/contact';
import { DatePipe } from '@angular/common';
import { AddTask } from '../../add-task/add-task';
import { TasksService } from '../../../../core/tasks.service';

@Component({
    selector: 'app-task-overlay',
    imports: [DatePipe, AddTask],
    templateUrl: './task-overlay.html',
    styleUrl: './task-overlay.scss',
})
export class TaskOverlay {
    private dialogRef = viewChild<ElementRef<HTMLDialogElement>>('dialog');
    tasksDisplayService = inject(TasksDisplayService);
    tasksService = inject(TasksService);

    protected readonly getAvatarColor = getAvatarColor;
    protected readonly getInitials = getInitials;

    overlayisOpen = input.required<boolean>();
    overlayisEditMode = input.required<boolean>();
    task = input<Task | null>(null);
    closed = output<'created' | 'edited' | 'deleted' | null>();
    isSaving = signal(false);

    constructor() {
        effect(() => {
            const dialog = this.dialogRef()?.nativeElement;
            if (dialog && !dialog.open) {
                dialog.showModal();
            }
        });

        // effect(() => {
        //     if (!this.overlayisOpen()) return;
        //     const contact = this.contact();
        //     this.contactForm().reset();
        //     this.contactModel.set({
        //         name: contact?.name ?? '',
        //         email: contact?.email ?? '',
        //         phone: contact?.phone ?? '',
        //     });
        // });
    }

    onDialogClick(event: MouseEvent) {
        if (event.target === this.dialogRef()?.nativeElement) {
            this.close();
        }
    }

    onCancel(event: Event) {
        event.preventDefault();
        this.close();
    }

    onCloseButtonClick() {
        this.close();
    }

    close(action: 'created' | 'edited' | 'deleted' | null = null) {
        this.closed.emit(action);
    }

    assignedContacts = computed(() => {
        const task = this.task();
        return task ? this.tasksDisplayService.assignedContacts(task) : [];
    });

    categoryClass = computed(() => {
        const task = this.task();
        return task ? this.tasksDisplayService.categoryClass(task) : '';
    });

    toggleSubtask(subtaskId: number, done: boolean) {
        this.tasksService.toggleSubtask(subtaskId, !done);
    }

    deleteTask(taskId: number) {
        this.tasksService.deleteTask(taskId);
        this.close('deleted');
    }
}
