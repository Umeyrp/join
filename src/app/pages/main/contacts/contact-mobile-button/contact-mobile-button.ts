import { Component, ElementRef, HostListener, inject, input, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Contact } from '../../../../interfaces/contact';
import { ContactsService } from '../../../../core/contacts.service';
import { ContactsOverlayService } from '../../../../core/contacts-overlay-service';

/**
 * Floating action button for contact actions on mobile.
 *
 * When no contact is selected the button opens the add overlay.
 * When a contact is selected it opens a slide-up menu with edit and delete options.
 * Outside clicks collapse the menu via a `document:click` host listener.
 * Closing is animated — the menu waits 400 ms before fully hiding.
 */
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

    /** The currently selected contact or `null` when no contact is active. */
    readonly contact = input<Contact | null>(null);

    /** Whether the action menu is fully open. */
    protected readonly isMenuOpen = signal(false);

    /** `true` during the close animation (menu is visible but animating out). */
    protected readonly isMenuClosing = signal(false);

    private closeTimeout?: ReturnType<typeof setTimeout>;

    /**
     * Closes the menu when a click occurs outside the component's host element.
     *
     * @param event - The native mouse event from the document click listener
     */
    @HostListener('document:click', ['$event'])
    onDocumentClick(event: MouseEvent): void {
        if (this.isMenuOpen() && !this.elementRef.nativeElement.contains(event.target)) {
            this.closeMenu();
        }
    }

    /**
     * Handles the primary button click.
     * Opens/closes the action menu when a contact is selected,
     * or opens the add overlay when no contact is active.
     */
    protected onMainClick(): void {
        if (this.contact()) {
            this.isMenuOpen() ? this.closeMenu() : this.isMenuOpen.set(true);
        } else {
            this.contactsOverlayService.openAddOverlay();
        }
    }

    /**
     * Triggers the close animation and hides the menu after 400 ms.
     * Clears any pending timeout to avoid race conditions.
     */
    protected closeMenu(): void {
        this.isMenuClosing.set(true);
        clearTimeout(this.closeTimeout);
        this.closeTimeout = setTimeout(() => {
            this.isMenuOpen.set(false);
            this.isMenuClosing.set(false);
        }, 400);
    }

    /** Opens the edit overlay for the current contact and closes the action menu. */
    protected onEdit(): void {
        this.contactsOverlayService.openEditOverlay(this.contact()!);
        this.closeMenu();
    }

    /**
     * Deletes the current contact, records the action, closes the menu,
     * and navigates up to the contacts list.
     */
    protected async onDelete(): Promise<void> {
        await this.contactsService.deleteContact(this.contact()!.id);
        this.contactsOverlayService.lastAction.set('deleted');
        this.closeMenu();
        this.router.navigate(['../'], { relativeTo: this.route });
    }
}
