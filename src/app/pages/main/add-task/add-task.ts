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

@Component({
    selector: 'app-add-task',
    imports: [Dropdown, Button],
    templateUrl: './add-task.html',
    styleUrl: './add-task.scss',
})
export class AddTask {
    priority = signal<'urgent' | 'medium' | 'low'>('medium');
    subtasks = signal<string[]>([]);
    newSubtask = signal('');
    title = signal('');
    description = signal('');
    dueDate = signal('');
    selectedContacts = signal<Contact[]>([]);
    selectedCategory = signal<string | null>(null);
    resetDropdown = signal(false);
    editingIndex = signal<number | null>(null);
    editingValue = signal('');
    titleTouched = signal(false);
    dueDateTouched = signal(false);
    categoryTouched = signal(false);
    isOverlay = input<boolean>(false);
    closeRequested = output<void>();
    showToast = signal(false);
    private tasksOverlayService = inject(TasksOverlayService);
    private route = inject(ActivatedRoute);
    private defaultStatus = signal<Status>('todo');
    private router = inject(Router);

    private supabase = inject(Supabase);

    constructor() {
        this.route.queryParams.subscribe((params) => {
            if (params['status']) {
                this.defaultStatus.set(params['status']);
            }
        });
    }

    setPriority(value: 'urgent' | 'medium' | 'low') {
        this.priority.set(value);
    }

    addSubtask() {
        if (this.newSubtask().trim()) {
            this.subtasks.update((current) => [...current, this.newSubtask().trim()]);
            this.newSubtask.set('');
        }
    }

    clearForm() {
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

    async createTask() {
        const status = this.isOverlay()
            ? this.tasksOverlayService.defaultStatus()
            : this.defaultStatus();
        const { data: lastTask } = await this.supabase.client
            .from('tasks')
            .select('position')
            .eq('status', status)
            .order('position', { ascending: false })
            .limit(1)
            .single();

        const position = lastTask ? lastTask.position + 1 : 0;
        const [day, month, year] = this.dueDate().split('/');
        const formattedDate = `${year}-${month}-${day}`;

        const { data: task, error } = await this.supabase.client
            .from('tasks')
            .insert({
                title: this.title(),
                description: this.description(),
                due_date: formattedDate,
                priority: this.priority(),
                category: this.selectedCategory(),
                status: status,
                position,
            })
            .select('id')
            .single();

        if (error || !task) {
            console.error(error);
            return;
        }

        if (this.selectedContacts().length > 0) {
            await this.supabase.client
                .from('task_contacts')
                .insert(
                    this.selectedContacts().map((c) => ({ task_id: task.id, contact_id: c.id })),
                );
        }

        if (this.subtasks().length > 0) {
            await this.supabase.client
                .from('subtasks')
                .insert(this.subtasks().map((s) => ({ task_id: task.id, title: s })));
        }

        this.clearForm();

        if (this.isOverlay()) {
            this.tasksOverlayService.closeOverlay(true);
        } else {
            this.showToast.set(true);
            setTimeout(() => {
                this.router.navigate(['/board']);
            }, 3000);
        }
    }

    isFormValid = computed(
        () =>
            this.title().trim().length > 0 &&
            this.dueDate().length > 0 &&
            this.selectedCategory() !== null,
    );

    startEdit(index: number) {
        this.editingIndex.set(index);
        this.editingValue.set(this.subtasks()[index]);
    }

    saveEdit(index: number) {
        if (this.editingValue().trim().length === 0) {
            this.deleteSubtask(index);
        } else {
            this.subtasks.update((current) =>
                current.map((s, i) => (i === index ? this.editingValue().trim() : s)),
            );
        }
        this.editingIndex.set(null);
    }

    deleteSubtask(index: number) {
        this.subtasks.update((current) => current.filter((_, i) => i !== index));
    }

    titleInvalid = computed(() => this.titleTouched() && this.title().trim().length === 0);
    dueDateInvalid = computed(
        () => (this.dueDateTouched() && this.dueDate().length === 0) || this.dueDateFormatInvalid(),
    );

    formatDueDate(value: string, input: HTMLInputElement) {
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

    @HostBinding('class.overlay') get overlayClass() {
        return this.isOverlay();
    }

    @ViewChild('datePicker') datePickerRef!: ElementRef<HTMLInputElement>;

    openDatePicker() {
        this.datePickerRef.nativeElement.showPicker();
    }

    onDatePickerChange(value: string) {
        const [year, month, day] = value.split('-');
        this.dueDate.set(`${day}/${month}/${year}`);
    }
}
