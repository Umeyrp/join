export type Priority = 'urgent' | 'medium' | 'low';
export type Category = 'Technical Task' | 'User Story';
export type Status = 'todo' | 'in_progress' | 'await_feedback' | 'done';

export interface Subtask {
    id: number;
    task_id: number;
    title: string;
    done: boolean;
}

export interface Task {
    id: number;
    created_at: string;
    title: string;
    description: string | null;
    due_date: string;
    priority: Priority;
    category: Category;
    status: Status;
    position: number;
    subtasks: Subtask[];
    contactIds: number[];
}

export type NewTask = Omit<Task, 'id' | 'created_at' | 'subtasks' | 'contactIds'> & {
    subtasks?: string[];
    contactIds?: number[];
};
