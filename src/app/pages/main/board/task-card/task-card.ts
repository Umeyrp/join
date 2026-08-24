import { Component, computed, inject, input } from '@angular/core';
import { Task } from '../../../../interfaces/task';
import { Contact, getAvatarColor, getInitials } from '../../../../interfaces/contact';
import { ContactsService } from '../../../../core/contacts.service';

@Component({
    selector: 'app-task-card',
    imports: [],
    templateUrl: './task-card.html',
    styleUrl: './task-card.scss',
})
export class TaskCard {
    task = input.required<Task>();

    protected readonly contactsService = inject(ContactsService);
    protected readonly getAvatarColor = getAvatarColor;
    protected readonly getInitials = getInitials;

    protected readonly assignedContacts = computed(() =>
        this.task()
            .contactIds.map((id) =>
                this.contactsService.contacts().find((contact) => contact.id === id),
            )
            .filter((contact): contact is Contact => contact !== undefined),
    );

    protected readonly categoryClass = computed(() =>
        this.task().category === 'User Story' ? 'user-story' : 'technical-task',
    );

    protected readonly subtaskProgress = computed(() => {
        const subtasks = this.task().subtasks;
        if (subtasks.length === 0) return null;

        const done = subtasks.filter((subtask) => subtask.done).length;
        const percent = (done / subtasks.length) * 100;
        const color = percent < 34 ? '#ff3d00' : percent < 67 ? '#ffa800' : '#7ae229';

        return { done, total: subtasks.length, percent: Math.max(percent, 5), color };
    });
}
