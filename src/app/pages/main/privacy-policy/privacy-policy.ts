import { Component, inject } from '@angular/core';
import { Location } from '@angular/common';

/**
 * Static privacy policy page.
 * Provides a back button that returns to the previous browser history entry.
 */
@Component({
    selector: 'app-privacy-policy',
    imports: [],
    templateUrl: './privacy-policy.html',
    styleUrl: './privacy-policy.scss',
})
export class PrivacyPolicy {
    private location = inject(Location);

    /** Navigates back to the previous page in the browser history. */
    goBack(): void {
        this.location.back();
    }
}
