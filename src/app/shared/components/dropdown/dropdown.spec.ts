import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Dropdown } from './dropdown';

describe('Dropdown', () => {
    let component: Dropdown;
    let fixture: ComponentFixture<Dropdown>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [Dropdown],
        }).compileComponents();

        fixture = TestBed.createComponent(Dropdown);
        component = fixture.componentInstance;
        await fixture.whenStable();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
