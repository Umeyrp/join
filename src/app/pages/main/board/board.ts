import { Component, inject } from '@angular/core';
import { TasksService } from '../../../core/tasks.service';

@Component({
    selector: 'app-board',
    imports: [],
    templateUrl: './board.html',
    styleUrl: './board.scss',
})
export class Board {
    protected readonly tasksService = inject(TasksService);
}
