# Join

Join is a Kanban board web app built with Angular and Supabase, developed as a training project during the Developer Akademie bootcamp. It lets you organize tasks across columns (To Do, In Progress, Await Feedback, Done), assign them to contacts, and track progress with drag and drop.

## Features

- Sign up and log in with email and password, or use Guest Login to try the app without creating an account.
- A summary dashboard showing task counts by status and the next upcoming urgent deadline.
- A board with four columns. Tasks can be moved between columns with drag and drop, or through a menu on touch devices.
- Search and filter tasks on the board by title, description, or assigned contact.
- Add tasks with a title, description, due date, priority, category, assigned contacts, and subtasks.
- Click any task to open its details, check off subtasks, edit it, or delete it.
- A contact list grouped alphabetically, with colored initials as avatars. Contacts can be added, edited, and deleted.
- A help page explaining how the board works.

## Tech Stack

- Angular 22 (zoneless, Signals)
- Supabase for authentication, the database, and realtime updates
- SCSS for styling

## Setup

1. Install dependencies.

    ```bash
    npm install
    ```

2. Create a Supabase project at [supabase.com](https://supabase.com) and open `src/environments/environment.ts` and `src/environments/environment.development.ts`. Replace the placeholder values with your own project URL and anon key, both found in the Supabase dashboard under Project Settings, API.

    ```ts
    export const environment = {
        production: false,
        supabaseUrl: 'YOUR_SUPABASE_URL',
        supabaseAnonKey: 'YOUR_SUPABASE_ANON_KEY',
    };
    ```

    The database schema (tables and RLS policies) is not included in this repository. Based on the code, the app expects at least these tables: `contacts`, `tasks`, `subtasks`, and `task_contacts` (linking tasks to contacts). They need to be recreated manually in your own Supabase project.

3. Start the development server.

    ```bash
    npm start
    ```

    The app runs at `http://localhost:4200`.

## Available Scripts

- `npm start` runs the development server.
- `npm run build` creates a production build in `dist/`.
- `npm test` runs the unit tests with Vitest.
- `npm run watch` builds the app in watch mode.

## How to Use the App

1. Open the app and either sign up with your name, email, and password, log in with an existing account, or click Guest Login to explore without registering.
2. After logging in, you land on the summary page, which shows how many tasks are in each status and highlights the next urgent deadline.
3. Go to the board to see all tasks sorted into four columns. Drag a task card to a different column to change its status, or use the menu option on mobile.
4. Click the plus button in any column, or go to Add Task, to create a new task. Fill in the title, due date, and category, and optionally set a priority, assign contacts, and add subtasks.
5. Click any task card to open its details. From there you can check off subtasks, edit the task, or delete it.
6. Use the search box and the contact filter on the board to quickly find specific tasks.
7. Go to Contacts to see everyone assigned to tasks. You can add new contacts, edit existing ones, or remove them.
8. Visit the Help page at any time for a short walkthrough of the board.
