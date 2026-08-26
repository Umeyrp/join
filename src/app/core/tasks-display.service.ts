import { Service, inject } from '@angular/core';
import { Task } from '../interfaces/task';
import { Contact } from '../interfaces/contact';
import { ContactsService } from './contacts.service';

@Service()
export class TasksDisplayService {
    private readonly contactsService = inject(ContactsService);

    categoryClass(task: Task) {
        return task.category === 'User Story' ? 'user-story' : 'technical-task';
    }

    assignedContacts(task: Task): Contact[] {
        return task.contactIds
            .map((id) => this.contactsService.contacts().find((contact) => contact.id === id))
            .filter((contact): contact is Contact => contact !== undefined);
    }

    subtaskProgress(task: Task) {
        const subtasks = task.subtasks;
        if (subtasks.length === 0) return null;

        const done = subtasks.filter((subtask) => subtask.done).length;
        const percent = (done / subtasks.length) * 100;
        const color = percent < 34 ? '#ff3d00' : percent < 67 ? '#ffa800' : '#7ae229';

        return { done, total: subtasks.length, percent: Math.max(percent, 5), color };
    }
}
