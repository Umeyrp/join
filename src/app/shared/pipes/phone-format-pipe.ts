import { Pipe, PipeTransform } from '@angular/core';

/**
 * Pipe for formatting German phone numbers into a readable display format.
 *
 * Strips whitespace, then matches the pattern `+49 XXXX XXXXXXX`.
 * Numbers that do not match the pattern are returned unchanged.
 *
 * @example
 * `'+491234567890' | phoneFormat` → `'+49 1234 567890'`
 */
@Pipe({
    name: 'phoneFormat',
})
export class PhoneFormatPipe implements PipeTransform {
    /**
     * Formats a raw phone number string.
     *
     * @param value - The raw phone number, e.g. `'+491234567890'`
     * @returns The formatted string `'+49 XXXX XXXXXXX'`,
     *          or the original `value` if it does not match the expected pattern
     */
    transform(value: string): string {
        const digits = value.replace(/\s+/g, '');
        const match = digits.match(/^(\+49)(\d{4})(\d+)$/);

        if (!match) {
            return value;
        }

        const [, countryCode, prefix, rest] = match;
        return `${countryCode} ${prefix} ${rest}`;
    }
}
