import { Component, computed, inject, signal } from '@angular/core';
import { ContactsService } from '../../../core/contacts.service';
import { Contact, getAvatarColor, getInitials } from '../../../interfaces/contact';
import { RouterLink } from '@angular/router';
import { TasksService } from '../../../core/tasks.service';
import { Button } from '../../../shared/components/button/button';
import { TaskCard } from './task-card/task-card';
import { TaskOverlay } from './task-overlay/task-overlay';
import { TasksOverlayService } from '../../../core/tasks-overlay-service';
import { TasksDisplayService } from '../../../core/tasks-display.service';
import { Status, Task } from '../../../interfaces/task';
import { CdkDrag, CdkDragDrop, CdkDropList, moveItemInArray } from '@angular/cdk/drag-drop';

@Component({
    selector: 'app-board',
    imports: [Button, TaskCard, TaskOverlay, CdkDropList, CdkDrag],
    templateUrl: './board.html',
    styleUrl: './board.scss',
})
export class Board {
    protected readonly getAvatarColor = getAvatarColor;
    protected readonly getInitials = getInitials;

    protected readonly tasksService = inject(TasksService);
    protected tasksOverlayService = inject(TasksOverlayService);
    private readonly contactsService = inject(ContactsService);

    protected readonly searchTerm = signal('');
    protected readonly assigneeFilter = signal<Contact | null>(null);
    protected readonly isTouchLayout = signal(window.innerWidth <= 900);

    private readonly tasksDisplayService = inject(TasksDisplayService);

    protected readonly nameSuggestions = computed(() => {
        const term = this.searchTerm().trim().toLowerCase();
        if (!term || this.assigneeFilter()) return [];

        return this.contactsService
            .contacts()
            .filter((contact) => contact.name.toLowerCase().includes(term));
    });

    private readonly statuses: Status[] = ['todo', 'in_progress', 'await_feedback', 'done'];

    protected readonly hasNoSearchResults = computed(() => {
        const term = this.searchTerm().trim();
        if (!term) return false;
        return this.statuses.every((status) => this.tasksByStatus(status).length === 0);
    });

    protected selectAssignee(contact: Contact) {
        this.assigneeFilter.set(contact);
        this.searchTerm.set('');
    }

    protected clearAssigneeFilter() {
        this.assigneeFilter.set(null);
    }

    protected tasksByStatus(status: Status): Task[] {
        const term = this.searchTerm().trim().toLowerCase();
        const assignee = this.assigneeFilter();

        return this.tasksService
            .tasks()
            .filter((task) => task.status === status)
            .filter((task) => this.matchesSearch(task, term))
            .filter((task) => this.matchesAssignee(task, assignee))
            .sort((a, b) => a.position - b.position);
    }

    private matchesAssignee(task: Task, assignee: Contact | null): boolean {
        if (!assignee) return true;
        return this.tasksDisplayService
            .assignedContacts(task)
            .some((contact) => contact.id === assignee.id);
    }

    private matchesSearch(task: Task, term: string): boolean {
        if (!term) return true;
        return (
            task.title.toLowerCase().includes(term) ||
            (task.description ?? '').toLowerCase().includes(term)
        );
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

    async onMoveTask(task: Task, newStatus: Status) {
        const position = this.tasksByStatus(newStatus).length;
        const previousTasks = this.tasksService.tasks();

        const updatedTasks = previousTasks.map((t) =>
            t.id === task.id ? { ...t, status: newStatus, position } : t,
        );
        this.tasksService.applyOptimisticReorder(updatedTasks);

        try {
            await this.tasksService.updateTaskStatusAndPosition(task.id, newStatus, position);
        } catch {
            this.tasksService.applyOptimisticReorder(previousTasks);
        }
    }

    openAddTask() {
        this.tasksOverlayService.openAddTask();
    }
}
