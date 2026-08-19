export interface Contact {
    id: number;
    name: string;
    email: string;
    phone: string;
}

export type NewContact = Omit<Contact, 'id'>;

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

export const getAvatarColor = (id: number): string => AVATAR_COLORS[id % AVATAR_COLORS.length];

export const getInitials = (name: string): string => {
    const words = name.trim().split(/\s+/);
    const first = words[0]?.[0] ?? '';
    const last = words.length > 1 ? words[words.length - 1][0] : '';
    return (first + last).toUpperCase();
};
