import { Component, inject, output, signal } from '@angular/core';
import { IntroService } from '../../../core/intro.service';

/** How long the big centered logo holds before shrinking into its resting spot. */
const INTRO_HOLD_MS = 800;

/**
 * Full-screen intro animation shown on top of the login page: a centered logo
 * that shrinks into its resting corner position, then fades the backdrop out.
 * Skips itself (via IntroService/sessionStorage) after it has played once per session.
 */
@Component({
    selector: 'app-intro',
    imports: [],
    templateUrl: './intro.html',
    styleUrl: './intro.scss',
})
export class Intro {
    private introService = inject(IntroService);
    /** True once the intro has already played this session; disables the CSS transition. */
    protected readonly skipAnimation = this.introService.hasPlayedIntro();
    /** Drives the `.done` class (logo docked, backdrop hidden); starts true if skipped. */
    protected introDone = signal(this.skipAnimation);
    /** Emitted once the overlay's fade-out transition has fully finished. */
    introFinished = output<void>();

    constructor() {
        if (!this.introDone()) {
            setTimeout(() => this.introDone.set(true), INTRO_HOLD_MS);
        }
    }

    /**
     * Fires on every CSS transition on the backdrop; only the backdrop's own
     * opacity transition should count, not a bubbled one from a child element,
     * hence the target check.
     */
    protected onOverlayTransitionEnd(event: TransitionEvent): void {
        if (event.target !== event.currentTarget) return;
        this.introFinished.emit();
        this.introService.markIntroAsPlayed();
    }
}
