import { Component, computed, inject, signal, AfterViewInit, OnDestroy } from '@angular/core';
import { TasksService } from '../../../core/tasks.service';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth.service';

@Component({
    selector: 'app-summary',
    imports: [DatePipe, RouterLink],
    templateUrl: './summary.html',
    styleUrl: './summary.scss',
})
export class Summary implements AfterViewInit, OnDestroy {
    private tasksService = inject(TasksService);
    private authService = inject(AuthService);

    readonly tasks = this.tasksService.tasks;

    readonly todoCount = computed(() => this.tasks().filter((t) => t.status === 'todo').length);
    readonly doneCount = computed(() => this.tasks().filter((t) => t.status === 'done').length);
    readonly inProgressCount = computed(
        () => this.tasks().filter((t) => t.status === 'in_progress').length,
    );
    readonly awaitFeedbackCount = computed(
        () => this.tasks().filter((t) => t.status === 'await_feedback').length,
    );
    readonly urgentCount = computed(
        () => this.tasks().filter((t) => t.priority === 'urgent').length,
    );
    readonly totalCount = computed(() => this.tasks().length);

    readonly nextUrgentDeadline = computed(() => {
        const today = new Date();
        return (
            this.tasks()
                .filter((t) => t.priority === 'urgent' && t.status !== 'done')
                .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
                .find((t) => new Date(t.due_date) >= today) ?? null
        );
    });

    showWelcome = signal(false);

    ngAfterViewInit() {
        setTimeout(() => {
            this.evaluateWelcome();
        });

        window.addEventListener('resize', this.onResize);
    }

    private onResize = () => {
        this.evaluateWelcome();
    };

    private evaluateWelcome() {
        if (window.innerWidth <= 1234) {
            if (!sessionStorage.getItem('welcomeShown')) {
                this.showWelcome.set(true);
                sessionStorage.setItem('welcomeShown', 'true');
                setTimeout(() => this.showWelcome.set(false), 3300);
            }
        } else {
            this.showWelcome.set(true);
        }
    }

    ngOnDestroy() {
        window.removeEventListener('resize', this.onResize);
    }

    greeting = computed(() => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 18) return 'Good afternoon';
        return 'Good evening';
    });

    currentUser = computed(() => {
        const user = this.authService.currentUser();
        if (!user) return null;
        if (user.isGuest) return null;
        return user.name;
    });
}
