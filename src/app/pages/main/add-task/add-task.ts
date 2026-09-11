import {
    Component,
    inject,
    signal,
    computed,
    input,
    HostBinding,
    output,
    ViewChild,
    ElementRef,
} from '@angular/core';
import { Dropdown } from '../../../shared/components/dropdown/dropdown';
import { Supabase } from '../../../core/supabase';
import { Contact } from '../../../interfaces/contact';
import { Button } from '../../../shared/components/button/button';
import { TasksOverlayService } from '../../../core/tasks-overlay-service';
import { ActivatedRoute, Router } from '@angular/router';
import { Status } from '../../../interfaces/task';

/**
 * Form component for creating new tasks.
 *
 * Can be used in two modes:
 * - **Standalone page** (`/add-task` route): after saving, shows a toast and
 *   navigates to the board after 3 seconds.
 * - **Overlay** (inside `TaskOverlay`): controlled by `isOverlay = true`;
 *   after saving, closes the overlay with a toast via `TasksOverlayService`.
 *
 * The due date field uses a masked `DD/MM/YYYY` input with a native date-picker
 * fallback. The form validates title, due date, and category before submission.
 */
@Component({
    selector: 'app-add-task',
    imports: [Dropdown, Button],
    templateUrl: './add-task.html',
    styleUrl: './add-task.scss',
})
export class AddTask {
    private tasksOverlayService = inject(TasksOverlayService);
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private supabase = inject(Supabase);

    /** `true` when the component is embedded inside the task overlay (not a standalone page). */
    isOverlay = input<boolean>(false);

    /** Emitted when the overlay requests to be closed (overlay mode only). */
    closeRequested = output<void>();

    // ── Form field signals ──────────────────────────────────────────────────

    /** Task title input value. */
    title = signal('');

    /** Task description input value. */
    description = signal('');

    /** Due date in `DD/MM/YYYY` masked format. */
    dueDate = signal('');

    /** Selected priority level. */
    priority = signal<'urgent' | 'medium' | 'low'>('medium');

    /** List of subtask titles entered by the user. */
    subtasks = signal<string[]>([]);

    /** Value of the new-subtask input field. */
    newSubtask = signal('');

    /** Contacts selected in the assignee dropdown. */
    selectedContacts = signal<Contact[]>([]);

    /** Category selected in the category dropdown, or `null` if not yet chosen. */
    selectedCategory = signal<string | null>(null);

    /**
     * Toggled to signal the `Dropdown` components to reset their state
     * after the form is cleared.
     */
    resetDropdown = signal(false);

    /** Index of the subtask currently being inline-edited, or `null`. */
    editingIndex = signal<number | null>(null);

    /** Buffer for the subtask title being edited. */
    editingValue = signal('');

    // ── Validation touched flags ────────────────────────────────────────────

    /** Whether the title field has been interacted with (activates error display). */
    titleTouched = signal(false);

    /** Whether the due date field has been interacted with. */
    dueDateTouched = signal(false);

    /** Whether the category dropdown has been interacted with. */
    categoryTouched = signal(false);

    /** Whether the toast confirmation is currently visible (standalone mode). */
    showToast = signal(false);

    /** The target status column read from the `status` query param (standalone mode). */
    private defaultStatus = signal<Status>('todo');

    @ViewChild('datePicker') datePickerRef!: ElementRef<HTMLInputElement>;

    constructor() {
        this.route.queryParams.subscribe((params) => {
            if (params['status']) this.defaultStatus.set(params['status']);
        });
    }

    /**
     * Applies the `overlay` CSS class to the host element when in overlay mode.
     * Allows the SCSS to adjust layout for the embedded variant.
     */
    @HostBinding('class.overlay') get overlayClass() {
        return this.isOverlay();
    }

    // ── Validation computed signals ─────────────────────────────────────────

    /** `true` when the form has all required valid values. */
    isFormValid = computed(
        () =>
            this.title().trim().length > 0 &&
            this.dueDate().length > 0 &&
            this.selectedCategory() !== null,
    );

    /** `true` when the title field is empty after being touched. */
    titleInvalid = computed(() => this.titleTouched() && this.title().trim().length === 0);

    /** `true` when the due date is missing after being touched or fails format validation. */
    dueDateInvalid = computed(
        () => (this.dueDateTouched() && this.dueDate().length === 0) || this.dueDateFormatInvalid(),
    );

    /**
     * `true` when the due date string is present but represents an invalid or past date.
     * Rejects incomplete strings, invalid month/day ranges, and dates before today.
     */
    dueDateFormatInvalid = computed(() => {
        const val = this.dueDate();
        if (val.length === 0) return false;
        if (val.length < 10) return true;
        const [day, month, year] = val.split('/').map(Number);
        if (month < 1 || month > 12) return true;
        const maxDay = new Date(year, month, 0).getDate();
        if (day < 1 || day > maxDay) return true;
        const entered = new Date(year, month - 1, day);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (entered < today) return true;
        return false;
    });

    // ── Form actions ────────────────────────────────────────────────────────

    /**
     * Sets the selected priority level.
     *
     * @param value - The priority to apply
     */
    setPriority(value: 'urgent' | 'medium' | 'low'): void {
        this.priority.set(value);
    }

    /**
     * Appends a non-blank subtask title to the list and clears the input.
     */
    addSubtask(): void {
        if (this.newSubtask().trim()) {
            this.subtasks.update((current) => [...current, this.newSubtask().trim()]);
            this.newSubtask.set('');
        }
    }

    /**
     * Resets all form fields to their initial state and toggles the
     * dropdown reset signal so the `Dropdown` components clear themselves.
     */
    clearForm(): void {
        this.title.set('');
        this.description.set('');
        this.dueDate.set('');
        this.priority.set('medium');
        this.subtasks.set([]);
        this.newSubtask.set('');
        this.selectedContacts.set([]);
        this.selectedCategory.set(null);
        this.resetDropdown.update((v) => !v);
        this.titleTouched.set(false);
        this.dueDateTouched.set(false);
        this.categoryTouched.set(false);
    }

    /**
     * Persists the new task to Supabase, including contact assignments and subtasks.
     * Determines the target status column and calculates the next available position.
     * After saving, clears the form and either closes the overlay or navigates to the board.
     */
    async createTask(): Promise<void> {
        const status = this.resolveTargetStatus();
        const position = await this.fetchNextPosition(status);
        const taskId = await this.insertTask(status, position);
        if (taskId === null) return;

        await this.insertContactAssignments(taskId);
        await this.insertSubtasks(taskId);

        this.clearForm();
        this.finishAfterSave();
    }

    /**
     * Returns the target status column for the new task.
     * In overlay mode the status comes from `TasksOverlayService`;
     * in standalone mode it comes from the route query param.
     */
    private resolveTargetStatus(): Status {
        return this.isOverlay() ? this.tasksOverlayService.defaultStatus() : this.defaultStatus();
    }

    /**
     * Queries Supabase for the highest existing `position` in the target column
     * and returns the next available index.
     *
     * @param status - The target status column
     * @returns The position to assign to the new task
     */
    private async fetchNextPosition(status: Status): Promise<number> {
        const { data } = await this.supabase.client
            .from('tasks')
            .select('position')
            .eq('status', status)
            .order('position', { ascending: false })
            .limit(1)
            .single();
        return data ? data.position + 1 : 0;
    }

    /**
     * Inserts the task row into Supabase and returns its new `id`.
     * Returns `null` and logs an error if the insert fails.
     *
     * @param status - The target status column
     * @param position - The pre-calculated position index
     * @returns The new task ID or `null` on failure
     */
    private async insertTask(status: Status, position: number): Promise<number | null> {
        const payload = this.buildTaskPayload(status, position);
        const { data, error } = await this.supabase.client
            .from('tasks')
            .insert(payload)
            .select('id')
            .single();
        if (error || !data) {
            console.error(error);
            return null;
        }
        return data.id;
    }

    /**
     * Builds the task insert payload from the current form signal values.
     *
     * @param status - The target status column
     * @param position - The pre-calculated position index
     * @returns Plain object ready for insertion into the `tasks` table
     */
    private buildTaskPayload(status: Status, position: number): object {
        const [day, month, year] = this.dueDate().split('/');
        return {
            title: this.title(),
            description: this.description(),
            due_date: `${year}-${month}-${day}`,
            priority: this.priority(),
            category: this.selectedCategory(),
            status,
            position,
        };
    }

    /**
     * Inserts `task_contacts` rows for all selected contacts.
     * No-ops when no contacts are selected.
     *
     * @param taskId - The ID of the newly created task
     */
    private async insertContactAssignments(taskId: number): Promise<void> {
        if (this.selectedContacts().length === 0) return;
        await this.supabase.client
            .from('task_contacts')
            .insert(this.selectedContacts().map((c) => ({ task_id: taskId, contact_id: c.id })));
    }

    /**
     * Inserts subtask rows for all entered subtask titles.
     * No-ops when no subtasks have been added.
     *
     * @param taskId - The ID of the newly created task
     */
    private async insertSubtasks(taskId: number): Promise<void> {
        if (this.subtasks().length === 0) return;
        await this.supabase.client
            .from('subtasks')
            .insert(this.subtasks().map((s) => ({ task_id: taskId, title: s })));
    }

    /**
     * Handles post-save navigation or overlay closure.
     * In overlay mode: closes the overlay with a confirmation toast.
     * In standalone mode: shows a toast and navigates to the board after 3 seconds.
     */
    private finishAfterSave(): void {
        if (this.isOverlay()) {
            this.tasksOverlayService.closeOverlay(true);
        } else {
            this.showToast.set(true);
            setTimeout(() => this.router.navigate(['/board']), 3000);
        }
    }

    // ── Subtask inline editing ──────────────────────────────────────────────

    /**
     * Enters inline editing mode for the subtask at the given index.
     *
     * @param index - Index of the subtask to edit
     */
    startEdit(index: number): void {
        this.editingIndex.set(index);
        this.editingValue.set(this.subtasks()[index]);
    }

    /**
     * Saves the edited subtask title or deletes the subtask if the new value is blank.
     *
     * @param index - Index of the subtask being saved
     */
    saveEdit(index: number): void {
        if (this.editingValue().trim().length === 0) {
            this.deleteSubtask(index);
        } else {
            this.subtasks.update((current) =>
                current.map((s, i) => (i === index ? this.editingValue().trim() : s)),
            );
        }
        this.editingIndex.set(null);
    }

    /**
     * Removes the subtask at the given index from the list.
     *
     * @param index - Index of the subtask to remove
     */
    deleteSubtask(index: number): void {
        this.subtasks.update((current) => current.filter((_, i) => i !== index));
    }

    // ── Date picker helpers ─────────────────────────────────────────────────

    /**
     * Formats raw digit input into `DD/MM/YYYY` as the user types.
     * Updates both the signal and the native input value directly.
     *
     * @param value - Raw string from the input change event
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
        this.dueDate.set(formatted);
        input.value = formatted;
    }

    /** Opens the native browser date picker programmatically. */
    openDatePicker(): void {
        this.datePickerRef.nativeElement.showPicker();
    }

    /**
     * Converts the native date picker's `YYYY-MM-DD` value to `DD/MM/YYYY`
     * and stores it in the `dueDate` signal.
     *
     * @param value - ISO date string from the native date picker
     */
    onDatePickerChange(value: string): void {
        const [year, month, day] = value.split('-');
        this.dueDate.set(`${day}/${month}/${year}`);
    }
}
