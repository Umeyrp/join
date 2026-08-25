import { Component, effect, ElementRef, input, output, signal, viewChild } from '@angular/core';
import { Task } from '../../../../interfaces/task';

@Component({
    selector: 'app-task-overlay',
    imports: [],
    templateUrl: './task-overlay.html',
    styleUrl: './task-overlay.scss',
})
export class TaskOverlay {
    private dialogRef = viewChild<ElementRef<HTMLDialogElement>>('dialog');

    overlayisOpen = input.required<boolean>();
    overlayisEditMode = input.required<boolean>();
    task = input.required<Task | null>();
    closed = output<'created' | 'edited' | 'deleted' | null>();
    isSaving = signal(false);

    constructor() {
        effect(() => {
            const dialog = this.dialogRef()?.nativeElement;
            if (dialog && !dialog.open) {
                dialog.showModal();
            }
        });

        // effect(() => {
        //     if (!this.overlayisOpen()) return;
        //     const contact = this.contact();
        //     this.contactForm().reset();
        //     this.contactModel.set({
        //         name: contact?.name ?? '',
        //         email: contact?.email ?? '',
        //         phone: contact?.phone ?? '',
        //     });
        // });
    }

    onDialogClick(event: MouseEvent) {
        if (event.target === this.dialogRef()?.nativeElement) {
            this.close();
        }
    }

    onCancel(event: Event) {
        event.preventDefault();
        this.close();
    }

    onCloseButtonClick() {
        this.close();
    }

    close(action: 'created' | 'edited' | 'deleted' | null = null) {
        this.closed.emit(action);
    }
}
