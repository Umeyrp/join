import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContactMobileButton } from './contact-mobile-button';

describe('ContactMobileButton', () => {
    let component: ContactMobileButton;
    let fixture: ComponentFixture<ContactMobileButton>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ContactMobileButton],
        }).compileComponents();

        fixture = TestBed.createComponent(ContactMobileButton);
        component = fixture.componentInstance;
        await fixture.whenStable();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
