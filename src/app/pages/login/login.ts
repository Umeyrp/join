import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { Intro } from './intro/intro';

@Component({
    selector: 'app-login',
    imports: [],
    templateUrl: './login.html',
    styleUrl: './login.scss',
})
export class Login {
    private fb = inject(FormBuilder);
    private auth = inject(AuthService);
    private router = inject(Router);

    readonly signupMode = signal(false);
    readonly loading = signal(false);
    readonly error = signal('');
    readonly form = this.fb.nonNullable.group({
        name: ['', Validators.required],
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(6)]],
        passwordConfirm: ['', Validators.required],
        privacyAccepted: [false, Validators.requiredTrue],
    });

    toggleMode() {
        this.signupMode.update((value) => !value);
        this.error.set('');
        this.form.reset({
            name: '',
            email: '',
            password: '',
            passwordConfirm: '',
            privacyAccepted: false,
        });
    }

    async submit() {
        const { email, password, name, passwordConfirm, privacyAccepted } = this.form.getRawValue();
        const needsSignup = this.signupMode();
        if (
            this.form.controls.email.invalid ||
            this.form.controls.password.invalid ||
            (needsSignup && (!name || !privacyAccepted || password !== passwordConfirm))
        ) {
            this.form.markAllAsTouched();
            this.error.set(
                needsSignup && password !== passwordConfirm
                    ? 'Die Passwörter stimmen nicht überein.'
                    : 'Bitte fülle alle Pflichtfelder korrekt aus.',
            );
            return;
        }

        this.loading.set(true);
        this.error.set('');
        const error = needsSignup
            ? await this.auth.signup(name, email, password)
            : await this.auth.login(email, password);
        this.loading.set(false);

        if (error) this.error.set(error);
        else await this.router.navigate(['/summary']);
    }

    async guestLogin() {
        this.loading.set(true);
        this.error.set('');
        const error = await this.auth.loginAsGuest();
        this.loading.set(false);

        if (error) this.error.set(error);
        else await this.router.navigate(['/summary']);
    }
}
