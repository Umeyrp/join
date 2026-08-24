import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TaskCard } from './task-card';

describe('TaskCard', () => {
    let component: TaskCard;
    let fixture: ComponentFixture<TaskCard>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [TaskCard],
        }).compileComponents();

        fixture = TestBed.createComponent(TaskCard);
        component = fixture.componentInstance;
        await fixture.whenStable();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
