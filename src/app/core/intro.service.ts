import { Service } from '@angular/core';

const INTRO_PLAYED_KEY = 'introPlayed';

@Service()
export class IntroService {
    hasPlayedIntro(): boolean {
        return sessionStorage.getItem(INTRO_PLAYED_KEY) === 'true';
    }

    markIntroAsPlayed(): void {
        sessionStorage.setItem(INTRO_PLAYED_KEY, 'true');
    }
}
