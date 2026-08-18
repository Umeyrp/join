import { Component, input, output, signal } from '@angular/core';

@Component({
    selector: 'app-overlay',
    imports: [],
    templateUrl: './overlay.html',
    styleUrl: './overlay.scss',
})
export class Overlay {
    open = input.required<boolean>();
    closed = output<void>();
    onClose(): void {
        this.closed.emit();
    }
}
