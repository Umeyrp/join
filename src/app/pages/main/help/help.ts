import { Location } from '@angular/common';
import { Component, inject } from '@angular/core';

@Component({
    selector: 'app-help',
    imports: [],
    templateUrl: './help.html',
    styleUrl: './help.scss',
})
export class Help {
    private location = inject(Location);

    goBack() {
        this.location.back();
    }
}
