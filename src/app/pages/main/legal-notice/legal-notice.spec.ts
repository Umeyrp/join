import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LegalNotice } from './legal-notice';

describe('LegalNotice', () => {
    let component: LegalNotice;
    let fixture: ComponentFixture<LegalNotice>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [LegalNotice],
        }).compileComponents();

        fixture = TestBed.createComponent(LegalNotice);
        component = fixture.componentInstance;
        await fixture.whenStable();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
