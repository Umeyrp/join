import { Component, inject } from '@angular/core';
import { Location } from '@angular/common';

/**
 * Static legal notice (Impressum) page.
 * Provides a back button that returns to the previous browser history entry.
 */
@Component({
    selector: 'app-legal-notice',
    imports: [],
    templateUrl: './legal-notice.html',
    styleUrl: './legal-notice.scss',
})
export class LegalNotice {
    private location = inject(Location);

    /** Navigates back to the previous page in the browser history. */
    goBack(): void {
        this.location.back();
    }
}
