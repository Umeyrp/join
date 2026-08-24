import { Component, signal } from '@angular/core';

@Component({
    selector: 'app-add-task',
    imports: [],
    templateUrl: './add-task.html',
    styleUrl: './add-task.scss',
})
export class AddTask {
    priority = signal<'urgent' | 'medium' | 'low'>('medium');

    setPriority(value: 'urgent' | 'medium' | 'low') {
        this.priority.set(value);
    }
}
