import { Component, inject } from '@angular/core';
import { Location } from '@angular/common';

@Component({
    selector: 'app-legal-notice',
    imports: [],
    templateUrl: './legal-notice.html',
    styleUrl: './legal-notice.scss',
})
export class LegalNotice {
    private location = inject(Location);

    goBack() {
        this.location.back();
    }
}
