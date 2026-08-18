import { TestBed } from '@angular/core/testing';

import { ContactsOverlayService } from './contacts-overlay-service';

describe('ContactsOverlayService', () => {
    let service: ContactsOverlayService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(ContactsOverlayService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
});
