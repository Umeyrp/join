import { Component, inject, signal, computed } from '@angular/core';
import { Dropdown } from '../../../shared/components/dropdown/dropdown';
import { Supabase } from '../../../core/supabase';
import { Contact } from '../../../interfaces/contact';

@Component({
    selector: 'app-add-task',
    imports: [Dropdown],
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

    private supabase = inject(Supabase);

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
    }

    async createTask() {
        const { data: lastTask } = await this.supabase.client
            .from('tasks')
            .select('position')
            .eq('status', 'todo')
            .order('position', { ascending: false })
            .limit(1)
            .single();

        const position = lastTask ? lastTask.position + 1 : 0;

        const { data: task, error } = await this.supabase.client
            .from('tasks')
            .insert({
                title: this.title(),
                description: this.description(),
                due_date: this.dueDate(),
                priority: this.priority(),
                category: this.selectedCategory(),
                status: 'todo',
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
        this.subtasks.update((current) =>
            current.map((s, i) => (i === index ? this.editingValue() : s)),
        );
        this.editingIndex.set(null);
    }

    deleteSubtask(index: number) {
        this.subtasks.update((current) => current.filter((_, i) => i !== index));
    }
}
