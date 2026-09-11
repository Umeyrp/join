import { Service } from '@angular/core';

const INTRO_PLAYED_KEY = 'introPlayed';

/**
 * Service for controlling the intro animation.
 *
 * Stores and reads the played flag from `sessionStorage`
 * so the animation is only shown once per browser session.
 *
 * @remarks
 * `hasPlayedIntro()` currently always returns `false` (hardcoded)
 * so the animation plays on every load during development.
 * The `sessionStorage` line is commented out and must be re-enabled for production.
 */
@Service()
export class IntroService {
    /**
     * Checks whether the intro animation has already played in this session.
     *
     * @returns `true` if the animation has already run, otherwise `false`
     * @todo Remove `return false` and re-enable the `sessionStorage` line
     */
    hasPlayedIntro(): boolean {
        return sessionStorage.getItem(INTRO_PLAYED_KEY) === 'true';
    }

    /**
     * Marks the intro animation as played.
     * Sets the flag in `sessionStorage` for the current browser session.
     */
    markIntroAsPlayed(): void {
        sessionStorage.setItem(INTRO_PLAYED_KEY, 'true');
    }
}
