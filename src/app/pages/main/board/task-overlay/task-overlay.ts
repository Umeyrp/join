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
import { NewTask, Task } from '../../../../interfaces/task';
import { TasksDisplayService } from '../../../../core/tasks-display.service';
import { Contact, getAvatarColor, getInitials } from '../../../../interfaces/contact';
import { DatePipe } from '@angular/common';
import { AddTask } from '../../add-task/add-task';
import { TasksService } from '../../../../core/tasks.service';
import { TasksOverlayService } from '../../../../core/tasks-overlay-service';
import { Button } from '../../../../shared/components/button/button';
import { form, required } from '@angular/forms/signals';
import { Dropdown } from '../../../../shared/components/dropdown/dropdown';

interface EditableSubtask {
    id: number | null; // null = neu, noch nicht gespeichert
    title: string;
}

@Component({
    selector: 'app-task-overlay',
    imports: [DatePipe, AddTask, Dropdown],
    templateUrl: './task-overlay.html',
    styleUrl: './task-overlay.scss',
})
export class TaskOverlay {
    private dialogRef = viewChild<ElementRef<HTMLDialogElement>>('dialog');
    tasksDisplayService = inject(TasksDisplayService);
    tasksService = inject(TasksService);
    tasksOverlayService = inject(TasksOverlayService);

    newSubtask = signal('');
    subtasks = signal<EditableSubtask[]>([]);
    editingIndex = signal<number | null>(null);
    editingValue = signal('');

    // IDs bestehender Subtasks, die im Edit-Mode gelöscht wurden
    private deletedSubtaskIds: number[] = [];

    deleteSubtask(index: number) {
        const item = this.subtasks()[index];
        if (item.id !== null) {
            this.deletedSubtaskIds.push(item.id);
        }
        this.subtasks.update((current) => current.filter((_, i) => i !== index));
    }

    editSubtask(index: number) {
        this.subtasks.update((current) =>
            current.map((s, i) => (i === index ? { ...s, title: this.editingValue() } : s)),
        );
        this.editingIndex.set(null);
    }

    startSubtaskEdit(index: number) {
        this.editingIndex.set(index);
        this.editingValue.set(this.subtasks()[index].title);
    }

    addSubtask() {
        const value = this.newSubtask().trim();
        if (value) {
            this.subtasks.update((current) => [...current, { id: null, title: value }]);
            this.newSubtask.set('');
        }
    }

    protected readonly getAvatarColor = getAvatarColor;
    protected readonly getInitials = getInitials;

    overlayisOpen = input.required<boolean>();
    overlayisEditMode = input.required<boolean>();
    task = input<Task | null>(null);
    closed = output<'created' | 'edited' | 'deleted' | null>();
    isSaving = signal(false);

    editTitle = signal('');
    editDescription = signal('');
    editDueDate = signal('');
    editPriority = signal<'urgent' | 'medium' | 'low'>('medium');
    editCategory = signal<'Technical Task' | 'User Story'>('Technical Task');
    editContacts = signal<Contact[]>([]);

    titleTouched = signal(false);
    dueDateTouched = signal(false);

    isFormValid = computed(
        () => this.editTitle().trim().length > 0 && this.editDueDate().length > 0,
    );

    constructor() {
        effect(() => {
            const dialog = this.dialogRef()?.nativeElement;
            if (dialog && !dialog.open) dialog.showModal();
        });

        effect(() => {
            const isOpen = this.overlayisOpen();
            const isEdit = this.overlayisEditMode();
            const t = this.task();

            if (!isOpen || !isEdit || !t) return;

            this.editTitle.set(t.title ?? '');
            this.editDescription.set(t.description ?? '');
            this.editDueDate.set(this.toDisplayDate(t.due_date));
            this.editPriority.set(t.priority);
            this.editCategory.set(t.category);
            this.editContacts.set(this.tasksDisplayService.assignedContacts(t));

            this.subtasks.set(t.subtasks.map((st) => ({ id: st.id, title: st.title })));
            this.deletedSubtaskIds = [];
            this.newSubtask.set('');
            this.editingIndex.set(null);

            this.titleTouched.set(false);
            this.dueDateTouched.set(false);
        });
    }

    private toDisplayDate(iso: string | null | undefined): string {
        if (!iso) return '';
        const [year, month, day] = iso.split('-');
        return `${day}/${month}/${year}`;
    }

    private toIsoDate(display: string): string {
        if (!display) return '';
        const [day, month, year] = display.split('/');
        return `${year}-${month}-${day}`;
    }

    formatDueDate(value: string, input: HTMLInputElement) {
        const digits = value.replace(/\D/g, '').slice(0, 8);
        let formatted = digits;
        if (digits.length >= 5) {
            formatted = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`;
        } else if (digits.length >= 3) {
            formatted = `${digits.slice(0, 2)}/${digits.slice(2)}`;
        }

        this.editDueDate.set(formatted);
        input.value = formatted;
    }

    setPriority(value: 'urgent' | 'medium' | 'low') {
        this.editPriority.set(value);
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

    async saveEdit(): Promise<void> {
        this.titleTouched.set(true);
        this.dueDateTouched.set(true);

        const t = this.task();
        if (!t || !this.isFormValid()) return;

        this.isSaving.set(true);
        try {
            await this.tasksService.updateTask(t.id, {
                title: this.editTitle().trim(),
                description: this.editDescription().trim() || null,
                due_date: this.toIsoDate(this.editDueDate()),
                priority: this.editPriority(),
                category: this.editCategory(),
                status: t.status,
                position: t.position,
            });

            await this.tasksService.syncTaskContacts(
                t.id,
                this.editContacts().map((c) => c.id),
            );

            await this.syncSubtasks(t.id);

            this.close('edited');
        } finally {
            this.isSaving.set(false);
        }
    }

    private async syncSubtasks(taskId: number): Promise<void> {
        const current = this.subtasks();

        const deletions = this.deletedSubtaskIds.map((id) =>
            this.tasksService.deleteSubtask(id),
        );
        const updates = current
            .filter((s) => s.id !== null)
            .map((s) => this.tasksService.updateSubtaskTitle(s.id as number, s.title));
        const inserts = current
            .filter((s) => s.id === null)
            .map((s) => this.tasksService.addSubtask(taskId, s.title));

        await Promise.all([...deletions, ...updates, ...inserts]);
        this.deletedSubtaskIds = [];
    }
}