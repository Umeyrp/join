import { Component, computed, input } from '@angular/core';

/**
 * Reusable button component with predefined visual variants.
 *
 * Renders a styled button whose appearance is controlled via `variant`.
 * All primary variants share the same CSS class; `delete` maps to the
 * cancel style. Pass `isSaving` to show a loading indicator while an
 * async operation is in progress.
 */
@Component({
    selector: 'app-button',
    imports: [],
    templateUrl: './button.html',
    styleUrl: './button.scss',
})
export class Button {
    /**
     * Visual variant of the button.
     * - `primary-contact` / `primary-task` — filled primary style
     * - `secondary` — outlined style
     * - `cancel` — muted dismissal style
     * - `delete` — maps to the cancel CSS class (destructive action)
     *
     * @default `'primary-contact'`
     */
    variant = input<'primary-contact' | 'primary-task' | 'secondary' | 'cancel' | 'delete'>(
        'primary-contact',
    );

    /**
     * HTML button type, forwarded to the native `<button>` element.
     * @default `'button'`
     */
    type = input<'button' | 'submit'>('button');

    /** Whether the button is disabled. */
    disabled = input<boolean>();

    /** When `true`, the button shows a loading/saving indicator. */
    isSaving = input<boolean>();

    /**
     * The CSS class applied to the host element.
     * Maps all `primary-*` variants to `'primary'` and `delete` to `'cancel'`.
     */
    styleClass = computed(() => {
        const variant = this.variant();
        if (variant.startsWith('primary')) return 'primary';
        if (variant === 'delete') return 'cancel';
        return variant;
    });

    /** Optional text label rendered inside the button. */
    label = input<string>();

    /**
     * Icon shown alongside the label.
     * @default `'plus'`
     */
    iconVariant = input<'check' | 'plus'>('plus');
}
