import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { form, pattern, required, FormField, submit } from '@angular/forms/signals';
import { AuthService } from '../../core/auth.service';
import { Intro } from './intro/intro';

interface LoginFormValue {
    name: string;
    email: string;
    password: string;
    passwordConfirm: string;
    privacyAccepted: boolean;
}

@Component({
    selector: 'app-login',
    imports: [FormField, RouterLink, Intro],
    templateUrl: './login.html',
    styleUrl: './login.scss',
})
export class Login {
    private auth = inject(AuthService);
    private router = inject(Router);

    readonly signupMode = signal(false);
    readonly loading = signal(false);
    readonly error = signal('');
    readonly passwordVisible = signal(false);
    readonly passwordConfirmVisible = signal(false);
    readonly passwordHasValue = computed(() => this.loginModel().password.length > 0);
    readonly passwordConfirmHasValue = computed(() => this.loginModel().passwordConfirm.length > 0);

    readonly passwordVisible = signal(false);
    readonly passwordConfirmVisible = signal(false);

    readonly loginModel = signal<LoginFormValue>({
        name: '',
        email: '',
        password: '',
        passwordConfirm: '',
        privacyAccepted: false,
    });

    loginForm = form(this.loginModel, (schemaPath) => {
        required(schemaPath.name, {
            message: 'First and last name are required',
            when: () => this.signupMode(),
        });
        pattern(schemaPath.name, /^\p{L}+ \p{L}+$/u, {
            message: 'First and last name are required',
            when: () => this.signupMode(),
        });

        required(schemaPath.email, { message: 'Email is required' });
        pattern(schemaPath.email, /[^@ \t\r\n]+@[^@ \t\r\n]+\.[^@ \t\r\n]+/, {
            message: 'Please enter a valid email address',
        });

        required(schemaPath.password, { message: 'Password is required' });
        pattern(schemaPath.password, /^.{6,}$/, {
            message: 'Password must be at least 6 characters',
        });

        required(schemaPath.passwordConfirm, {
            message: 'Your password don`t match. Please try again.',
            when: () => this.signupMode(),
        });
        pattern(schemaPath.passwordConfirm, /^.{6,}$/, {
            message: 'Please confirm your password',
            when: () => this.signupMode(),
        });

        required(schemaPath.privacyAccepted, {
            message: 'You must accept the privacy policy',
            when: () => this.signupMode(),
        });
    });

    toggleMode() {
        this.signupMode.update((value) => !value);
        this.error.set('');
        this.passwordVisible.set(false);
        this.passwordConfirmVisible.set(false);
        this.loginForm().reset();
        this.loginModel.set({
            name: '',
            email: '',
            password: '',
            passwordConfirm: '',
            privacyAccepted: false,
        });
    }

    async onSubmit(event: Event): Promise<void> {
        event.preventDefault();
        await submit(this.loginForm, async (f) => {
            const { name, email, password, passwordConfirm } = f().value();
            const needsSignup = this.signupMode();

            if (needsSignup && password !== passwordConfirm) {
                this.error.set("Your passwords don't match. Please try again.");
                return null;
            }

            this.loading.set(true);
            this.error.set('');

            const error = needsSignup
                ? await this.auth.signup(name, email, password)
                : await this.auth.login(email, password);

            this.loading.set(false);

            if (error) {
                this.error.set(error);
            } else {
                await this.router.navigate(['/summary']);
            }
            return null;
        });
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
