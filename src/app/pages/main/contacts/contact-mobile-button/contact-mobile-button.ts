import { Component, ElementRef, HostListener, inject, input, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Contact } from '../../../../interfaces/contact';
import { ContactsService } from '../../../../core/contacts.service';
import { ContactsOverlayService } from '../../../../core/contacts-overlay-service';

@Component({
    selector: 'app-contact-mobile-button',
    imports: [],
    templateUrl: './contact-mobile-button.html',
    styleUrl: './contact-mobile-button.scss',
})
export class ContactMobileButton {
    private contactsService = inject(ContactsService);
    private contactsOverlayService = inject(ContactsOverlayService);
    private router = inject(Router);
    private route = inject(ActivatedRoute);
    private elementRef = inject(ElementRef);

    readonly contact = input<Contact | null>(null);

    protected readonly isMenuOpen = signal(false);
    protected readonly isMenuClosing = signal(false);

    private closeTimeout?: ReturnType<typeof setTimeout>;

    @HostListener('document:click', ['$event'])
    onDocumentClick(event: MouseEvent) {
        if (this.isMenuOpen() && !this.elementRef.nativeElement.contains(event.target)) {
            this.closeMenu();
        }
    }

    protected onMainClick() {
        if (this.contact()) {
            if (this.isMenuOpen()) {
                this.closeMenu();
            } else {
                this.isMenuOpen.set(true);
            }
        } else {
            this.contactsOverlayService.openAddOverlay();
        }
    }

    protected closeMenu() {
        this.isMenuClosing.set(true);
        clearTimeout(this.closeTimeout);
        this.closeTimeout = setTimeout(() => {
            this.isMenuOpen.set(false);
            this.isMenuClosing.set(false);
        }, 400);
    }

    protected onEdit() {
        this.contactsOverlayService.openEditOverlay(this.contact()!);
        this.closeMenu();
    }

    protected async onDelete() {
        await this.contactsService.deleteContact(this.contact()!.id);
        this.contactsOverlayService.lastAction.set('deleted');
        this.closeMenu();
        this.router.navigate(['../'], { relativeTo: this.route });
    }
}
