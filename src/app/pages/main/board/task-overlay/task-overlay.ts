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
import { Contact, getAvatarColor, getInitials } from '../../../../interfaces/contact';
import { DatePipe } from '@angular/common';
import { AddTask } from '../../add-task/add-task';
import { TasksService } from '../../../../core/tasks.service';
import { TasksOverlayService } from '../../../../core/tasks-overlay-service';
import { Dropdown } from '../../../../shared/components/dropdown/dropdown';

/**
 * A subtask entry in the edit form.
 * New subtasks that have not yet been persisted carry `id: null`.
 */
interface EditableSubtask {
    /** Database ID or `null` for unsaved subtasks. */
    id: number | null;
    /** Current title value in the edit form. */
    title: string;
}

/**
 * Modal overlay for viewing, editing, and deleting tasks.
 *
 * Uses a native `<dialog>` element opened via `showModal()`.
 * In view mode the task details are rendered read-only.
 * In edit mode all fields become editable, including inline subtask management
 * (add, rename, delete). The date field uses a `DD/MM/YYYY` masked input format.
 * Subtask deletions are batched and applied on save.
 */
@Component({
    selector: 'app-task-overlay',
    imports: [DatePipe, AddTask, Dropdown],
    templateUrl: './task-overlay.html',
    styleUrl: './task-overlay.scss',
})
export class TaskOverlay {
    private dialogRef = viewChild<ElementRef<HTMLDialogElement>>('dialog');

    readonly tasksDisplayService = inject(TasksDisplayService);
    readonly tasksService = inject(TasksService);
    readonly tasksOverlayService = inject(TasksOverlayService);

    protected readonly getAvatarColor = getAvatarColor;
    protected readonly getInitials = getInitials;

    /** Whether the overlay is currently open. */
    overlayisOpen = input.required<boolean>();

    /** Whether the overlay is in edit mode. */
    overlayisEditMode = input.required<boolean>();

    /** The task to display or edit, or `null` when none is selected. */
    task = input<Task | null>(null);

    /** Emitted when the overlay closes with the action performed or `null` on cancel. */
    closed = output<'created' | 'edited' | 'deleted' | null>();

    /** `true` while an async save or delete is in progress. */
    isSaving = signal(false);

    // ── Edit-mode form signals ──────────────────────────────────────────────

    /** Editable title field value. */
    editTitle = signal('');

    /** Editable description field value. */
    editDescription = signal('');

    /** Editable due date in `DD/MM/YYYY` format. */
    editDueDate = signal('');

    /** Editable priority selection. */
    editPriority = signal<'urgent' | 'medium' | 'low'>('medium');

    /** Editable category selection. */
    editCategory = signal<'Technical Task' | 'User Story'>('Technical Task');

    /** Contacts currently assigned in the edit form. */
    editContacts = signal<Contact[]>([]);

    /** Subtask list shown in the edit form (includes unsaved entries). */
    subtasks = signal<EditableSubtask[]>([]);

    /** Current value of the new-subtask input field. */
    newSubtask = signal('');

    /** Index of the subtask currently being inline-edited, or `null`. */
    editingIndex = signal<number | null>(null);

    /** Buffer holding the value of the subtask being inline-edited. */
    editingValue = signal('');

    /** Whether the title field has been touched (enables validation display). */
    titleTouched = signal(false);

    /** Whether the due date field has been touched (enables validation display). */
    dueDateTouched = signal(false);

    /** IDs of existing subtasks deleted during this edit session. */
    private deletedSubtaskIds: number[] = [];

    readonly titleMaxLength = 100;

    /** `true` when the title is empty after being touched or exceeds the max length. */
    titleInvalid = computed(
        () =>
            (this.titleTouched() && this.editTitle().trim().length === 0) ||
            this.editTitle().length > this.titleMaxLength,
    );

    /** `true` when the due date is empty after being touched or fails format validation. */
    dueDateInvalid = computed(
        () =>
            (this.dueDateTouched() && this.editDueDate().length === 0) ||
            this.dueDateFormatInvalid(),
    );

    /**
     * `true` when the due date string is present but does not represent a valid calendar date.
     * Validates day-in-month ranges; does not enforce a minimum date.
     */
    dueDateFormatInvalid = computed(() => {
        const val = this.editDueDate();
        if (val.length === 0) return false;
        if (val.length < 10) return true;
        const [day, month, year] = val.split('/').map(Number);
        if (month < 1 || month > 12) return true;
        const maxDay = new Date(year, month, 0).getDate();
        if (day < 1 || day > maxDay) return true;
        return false;
    });

    /** `true` when all required edit fields are valid and the form can be submitted. */
    isFormValid = computed(() => !this.titleInvalid() && !this.dueDateInvalid());

    /** Resolved `Contact` objects for the task in view mode. */
    assignedContacts = computed(() => {
        const task = this.task();
        return task ? this.tasksDisplayService.assignedContacts(task) : [];
    });

    /** CSS category class for the task badge in view mode. */
    categoryClass = computed(() => {
        const task = this.task();
        return task ? this.tasksDisplayService.categoryClass(task) : '';
    });

    constructor() {
        effect(() => {
            const dialog = this.dialogRef()?.nativeElement;
            if (dialog && !dialog.open) dialog.showModal();
        });

        effect(() => {
            if (!this.overlayisOpen() || !this.overlayisEditMode() || !this.task()) return;
            this.populateEditForm(this.task()!);
        });
    }

    /**
     * Populates all edit-mode signals from the given task.
     * Resets validation touched state and clears pending deletions.
     *
     * @param t - The task whose data should fill the form
     */
    private populateEditForm(t: Task): void {
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
    }

    /**
     * Converts an ISO date string (`YYYY-MM-DD`) to display format (`DD/MM/YYYY`).
     *
     * @param iso - ISO date string or falsy value
     * @returns The formatted string or an empty string
     */
    private toDisplayDate(iso: string | null | undefined): string {
        if (!iso) return '';
        const [year, month, day] = iso.split('-');
        return `${day}/${month}/${year}`;
    }

    /**
     * Converts a display date string (`DD/MM/YYYY`) back to ISO format (`YYYY-MM-DD`).
     *
     * @param display - Date in `DD/MM/YYYY` format
     * @returns ISO date string or empty string
     */
    private toIsoDate(display: string): string {
        if (!display) return '';
        const [day, month, year] = display.split('/');
        return `${year}-${month}-${day}`;
    }

    /**
     * Formats raw digit input into `DD/MM/YYYY` as the user types.
     * Updates both the signal and the native input value.
     *
     * @param value - Raw input string from the change event
     * @param input - The native `<input>` element to update in place
     */
    formatDueDate(value: string, input: HTMLInputElement): void {
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

    /**
     * Sets the task priority in the edit form.
     *
     * @param value - The selected priority level
     */
    setPriority(value: 'urgent' | 'medium' | 'low'): void {
        this.editPriority.set(value);
    }

    /**
     * Marks a subtask for deletion and removes it from the edit form list.
     * Existing subtasks (with a database `id`) are queued for deletion on save.
     *
     * @param index - Index of the subtask in the current `subtasks` signal
     */
    deleteSubtask(index: number): void {
        const item = this.subtasks()[index];
        if (item.id !== null) this.deletedSubtaskIds.push(item.id);
        this.subtasks.update((current) => current.filter((_, i) => i !== index));
    }

    /**
     * Commits the current `editingValue` to the subtask at the given index
     * and exits inline editing mode.
     *
     * @param index - Index of the subtask being edited
     */
    editSubtask(index: number): void {
        this.subtasks.update((current) =>
            current.map((s, i) => (i === index ? { ...s, title: this.editingValue() } : s)),
        );
        this.editingIndex.set(null);
    }

    /**
     * Enters inline editing mode for the subtask at the given index.
     *
     * @param index - Index of the subtask to edit
     */
    startSubtaskEdit(index: number): void {
        this.editingIndex.set(index);
        this.editingValue.set(this.subtasks()[index].title);
    }

    /**
     * Appends a new unsaved subtask from the `newSubtask` input.
     * Does nothing if the input is blank.
     */
    addSubtask(): void {
        const value = this.newSubtask().trim();
        if (value) {
            this.subtasks.update((current) => [...current, { id: null, title: value }]);
            this.newSubtask.set('');
        }
    }

    /**
     * Closes the overlay when the user clicks the `<dialog>` backdrop.
     *
     * @param event - The click event on the dialog element
     */
    onDialogClick(event: MouseEvent): void {
        if (event.target === this.dialogRef()?.nativeElement) this.close();
    }

    /**
     * Cancels the overlay, preventing default form submission behaviour.
     *
     * @param event - The cancel event
     */
    onCancel(event: Event): void {
        event.preventDefault();
        this.close();
    }

    /** Closes the overlay without performing any action. */
    onCloseButtonClick(): void {
        this.close();
    }

    /**
     * Emits `closed` with the given action.
     *
     * @param action - The action to report or `null` on cancel
     */
    close(action: 'created' | 'edited' | 'deleted' | null = null): void {
        this.closed.emit(action);
    }

    /**
     * Toggles the `done` state of a subtask.
     *
     * @param subtaskId - The database ID of the subtask
     * @param done - The current state (will be toggled to its inverse)
     */
    toggleSubtask(subtaskId: number, done: boolean): void {
        this.tasksService.toggleSubtask(subtaskId, !done);
    }

    /**
     * Deletes the task and closes the overlay with action `'deleted'`.
     *
     * @param taskId - The ID of the task to delete
     */
    deleteTask(taskId: number): void {
        this.tasksService.deleteTask(taskId);
        this.close('deleted');
    }

    /**
     * Validates and persists all edit-mode changes.
     * Updates task metadata, syncs contact assignments, and applies subtask
     * deletions, renames, and insertions in parallel. Switches back to view
     * mode on success.
     */
    async saveEdit(): Promise<void> {
        this.titleTouched.set(true);
        this.dueDateTouched.set(true);
        const t = this.task();
        if (!t || !this.isFormValid()) return;
        this.isSaving.set(true);
        await this.persistTaskEdits(t).finally(() => this.isSaving.set(false));
        this.tasksOverlayService.isEditMode.set(false);
    }

    /**
     * Persists task metadata, contact assignments, and subtask changes.
     *
     * @param t - The original task being edited
     */
    private async persistTaskEdits(t: Task): Promise<void> {
        await this.tasksService.updateTask(t.id, {
            title: this.editTitle().trim(),
            description: this.editDescription().trim() || null,
            due_date: this.toIsoDate(this.editDueDate()),
            priority: this.editPriority(),
            category: this.editCategory(),
            status: t.status,
            position: t.position,
        });
        await this.persistRelations(t.id);
    }

    /**
     * Syncs contact assignments and subtask changes for the given task.
     *
     * @param taskId - The ID of the task being edited
     */
    private async persistRelations(taskId: number): Promise<void> {
        await this.tasksService.syncTaskContacts(
            taskId,
            this.editContacts().map((c) => c.id),
        );
        await this.syncSubtasks(taskId);
    }

    /**
     * Applies all pending subtask changes for a task in parallel:
     * deletes removed subtasks, updates renamed ones, and inserts new ones.
     *
     * @param taskId - The ID of the parent task
     */
    private async syncSubtasks(taskId: number): Promise<void> {
        const ops = this.buildSubtaskOps(taskId);
        await Promise.all(ops);
        this.deletedSubtaskIds = [];
    }

    /**
     * Builds the full set of subtask database operations for the current edit session.
     *
     * @param taskId - The ID of the parent task
     * @returns Array of promises covering deletions, title updates, and inserts
     */
    private buildSubtaskOps(taskId: number): Promise<void>[] {
        const current = this.subtasks();
        return [
            ...this.deletedSubtaskIds.map((id) => this.tasksService.deleteSubtask(id)),
            ...current
                .filter((s) => s.id !== null)
                .map((s) => this.tasksService.updateSubtaskTitle(s.id as number, s.title)),
            ...current
                .filter((s) => s.id === null)
                .map((s) => this.tasksService.addSubtask(taskId, s.title)),
        ];
    }
}
