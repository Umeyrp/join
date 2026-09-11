import { Location } from '@angular/common';
import { Component, inject } from '@angular/core';

/**
 * Static help page.
 * Provides a back button that returns to the previous browser history entry.
 */
@Component({
    selector: 'app-help',
    imports: [],
    templateUrl: './help.html',
    styleUrl: './help.scss',
})
export class Help {
    private location = inject(Location);

    /** Navigates back to the previous page in the browser history. */
    goBack(): void {
        this.location.back();
    }
}
