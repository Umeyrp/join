import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TasksService } from '../../../core/tasks.service';
import { ContactsService } from '../../../core/contacts.service';
import { Task } from '../../../interfaces/task';
import { Button } from '../../../shared/components/button/button';

@Component({
    selector: 'app-board',
    imports: [Button, RouterLink],
    templateUrl: './board.html',
    styleUrl: './board.scss',
})
export class Board {
    protected readonly tasksService = inject(TasksService);
    protected readonly contactsService = inject(ContactsService);

    protected contactName(id: number): string {
        return this.contactsService.contacts().find((c) => c.id === id)?.name ?? `#${id}`;
    }

    protected nextUnassignedContact(task: Task) {
        return this.contactsService.contacts().find((c) => !task.contactIds.includes(c.id));
    }

    protected addTestTask() {
        this.tasksService.addTask({
            title: 'Testeintrag ' + Date.now(),
            description: null,
            due_date: '2026-09-01',
            priority: 'medium',
            category: 'Technical Task',
            status: 'todo',
            position: 0,
        });
    }
}
