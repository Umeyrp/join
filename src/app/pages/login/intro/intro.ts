import { Component, inject, output, signal } from '@angular/core';
import { IntroService } from '../../../core/intro.service';

const INTRO_HOLD_MS = 800;

@Component({
    selector: 'app-intro',
    imports: [],
    templateUrl: './intro.html',
    styleUrl: './intro.scss',
})
export class Intro {
    private introService = inject(IntroService);
    protected readonly skipAnimation = this.introService.hasPlayedIntro();
    protected introDone = signal(this.skipAnimation);
    introFinished = output<void>();

    constructor() {
        if (!this.introDone()) {
            setTimeout(() => this.introDone.set(true), INTRO_HOLD_MS);
        }
    }

    protected onOverlayTransitionEnd(event: TransitionEvent): void {
        if (event.target !== event.currentTarget) return;
        this.introFinished.emit();
        this.introService.markIntroAsPlayed();
    }
}
