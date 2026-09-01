import { TestBed } from '@angular/core/testing';

import { TasksDisplayService } from './tasks-display.service';

describe('TasksDisplayService', () => {
    let service: TasksDisplayService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(TasksDisplayService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
});
