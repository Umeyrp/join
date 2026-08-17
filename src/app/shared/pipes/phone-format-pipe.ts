import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'phoneFormat',
})
export class PhoneFormatPipe implements PipeTransform {
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
