import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LegaNotice } from './lega-notice';

describe('LegaNotice', () => {
    let component: LegaNotice;
    let fixture: ComponentFixture<LegaNotice>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [LegaNotice],
        }).compileComponents();

        fixture = TestBed.createComponent(LegaNotice);
        component = fixture.componentInstance;
        await fixture.whenStable();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
