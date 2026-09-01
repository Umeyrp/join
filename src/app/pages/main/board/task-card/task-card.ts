import { Component, computed, inject, input, output, signal } from '@angular/core';
import { Status, Task } from '../../../../interfaces/task';
import { getAvatarColor, getInitials } from '../../../../interfaces/contact';
import { TasksDisplayService } from '../../../../core/tasks-display.service';

@Component({
    selector: 'app-task-card',
    imports: [],
    templateUrl: './task-card.html',
    styleUrl: './task-card.scss',
})
export class TaskCard {
    task = input.required<Task>();

    move = output<Status>();

    private readonly statusLabels: Record<Status, string> = {
        todo: 'To do',
        in_progress: 'In progress',
        await_feedback: 'Await feedback',
        done: 'Done',
    };

    private readonly statusOrder: Status[] = ['todo', 'in_progress', 'await_feedback', 'done'];

    protected readonly moveOptions = computed(() => {
        const currentStatus = this.task().status;
        const currentIndex = this.statusOrder.indexOf(currentStatus);

        return this.statusOrder
            .filter((status) => status !== currentStatus)
            .map((status) => ({
                status,
                label: this.statusLabels[status],
                direction:
                    this.statusOrder.indexOf(status) < currentIndex ? 'up' : ('down' as const),
            }));
    });

    protected readonly menuState = signal<'closed' | 'open' | 'closing'>('closed');

    protected openMoveMenu(event: Event) {
        event.stopPropagation();
        this.menuState.set('open');
    }

    protected closeMoveMenu(event?: Event) {
        event?.stopPropagation();
        if (this.menuState() === 'open') {
            this.menuState.set('closing');
        }
    }

    protected onMoveMenuAnimationEnd() {
        if (this.menuState() === 'closing') {
            this.menuState.set('closed');
        }
    }

    protected selectStatus(status: Status, event: Event) {
        event.stopPropagation();
        this.menuState.set('closing');
        this.move.emit(status);
    }

    private readonly tasksDisplayService = inject(TasksDisplayService);

    protected readonly getAvatarColor = getAvatarColor;
    protected readonly getInitials = getInitials;

    protected readonly categoryClass = computed(() =>
        this.tasksDisplayService.categoryClass(this.task()),
    );

    protected readonly assignedContacts = computed(() =>
        this.tasksDisplayService.assignedContacts(this.task()),
    );

    protected readonly subtaskProgress = computed(() =>
        this.tasksDisplayService.subtaskProgress(this.task()),
    );
}
