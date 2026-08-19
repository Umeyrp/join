import { Component, computed, input } from '@angular/core';

@Component({
    selector: 'app-button',
    imports: [],
    templateUrl: './button.html',
    styleUrl: './button.scss',
})
export class Button {
    variant = input<'primary-contact' | 'primary-task' | 'secondary' | 'cancel' | 'delete'>(
        'primary-contact',
    );
    type = input<'button' | 'submit'>('button');
    styleClass = computed(() => {
        const variant = this.variant();
        if (variant.startsWith('primary')) return 'primary';
        if (variant === 'delete') return 'cancel';
        return variant;
    });
}
