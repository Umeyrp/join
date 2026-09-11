/**
 * Represents a contact stored in the database.
 */
export interface Contact {
    /** Unique database ID. */
    id: number;
    /** Full display name. */
    name: string;
    /** Email address. */
    email: string;
    /** Phone number (may be an empty string). */
    phone: string;
}

/** Contact data for insert operations — all fields except the auto-generated `id`. */
export type NewContact = Omit<Contact, 'id'>;

/** Ordered list of hex colors cycled through for avatar backgrounds. */
const AVATAR_COLORS = [
    '#FF7A00',
    '#FF5EB3',
    '#6E52FF',
    '#9327FF',
    '#00BEE8',
    '#1FD7C1',
    '#FF745E',
    '#FFA35E',
    '#FC71FF',
    '#FFC701',
    '#0038FF',
    '#C3FF2B',
    '#FFE62B',
    '#FF4646',
    '#FFBB2B',
];

/**
 * Returns a deterministic avatar background color for a contact.
 * Cycles through `AVATAR_COLORS` using the contact's ID as index.
 *
 * @param id - The contact's database ID
 * @returns A hex color string
 */
export const getAvatarColor = (id: number): string => AVATAR_COLORS[id % AVATAR_COLORS.length];

/**
 * Derives up to two initials from a full name.
 * Uses the first character of the first word and the first character
 * of the last word (if more than one word is present).
 *
 * @param name - The full display name
 * @returns One or two uppercase initials, e.g. `'MH'` for `'Max Huber'`
 */
export const getInitials = (name: string): string => {
    const words = name.trim().split(/\s+/);
    const first = words[0]?.[0] ?? '';
    const last = words.length > 1 ? words[words.length - 1][0] : '';
    return (first + last).toUpperCase();
};
