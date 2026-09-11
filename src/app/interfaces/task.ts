/** Task priority level. */
export type Priority = 'urgent' | 'medium' | 'low';

/** Task category — determines the badge color in the board view. */
export type Category = 'Technical Task' | 'User Story';

/** Kanban column a task currently belongs to. */
export type Status = 'todo' | 'in_progress' | 'await_feedback' | 'done';

/**
 * A single checklist item belonging to a task.
 */
export interface Subtask {
    /** Unique database ID. */
    id: number;
    /** ID of the parent task. */
    task_id: number;
    /** Display title of the subtask. */
    title: string;
    /** Whether the subtask has been completed. */
    done: boolean;
}

/**
 * A full task as returned from the database,
 * including resolved subtasks and assigned contact IDs.
 */
export interface Task {
    /** Unique database ID. */
    id: number;
    /** ISO 8601 timestamp of when the task was created. */
    created_at: string;
    /** Short headline of the task. */
    title: string;
    /** Optional longer description or `null` if not set. */
    description: string | null;
    /** ISO 8601 date string for the task's due date. */
    due_date: string;
    /** Priority level of the task. */
    priority: Priority;
    /** Category determining the badge color in the board. */
    category: Category;
    /** Current Kanban column the task belongs to. */
    status: Status;
    /** Sort order within the current status column (used for drag and drop). */
    position: number;
    /** All subtasks belonging to this task. */
    subtasks: Subtask[];
    /** IDs of contacts assigned to this task. */
    contactIds: number[];
}

/**
 * Task data for insert operations.
 * Omits auto-generated fields (`id`, `created_at`, `subtasks`, `contactIds`)
 * and allows optionally passing subtask titles and contact IDs for creation.
 */
export type NewTask = Omit<Task, 'id' | 'created_at' | 'subtasks' | 'contactIds'> & {
    /** Optional list of subtask titles to create alongside the task. */
    subtasks?: string[];
    /** Optional list of contact IDs to assign to the new task. */
    contactIds?: number[];
};
