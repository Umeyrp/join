import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { form, pattern, required, FormField, submit } from '@angular/forms/signals';
import { AuthService } from '../../core/auth.service';
import { Intro } from './intro/intro';

/**
 * Represents the values used by the authentication form.
 */
interface LoginFormValue {
    /** The user's full name for sign-up. */
    name: string;
    /** The user's email address. */
    email: string;
    /** The current password entered by the user. */
    password: string;
    /** Confirmation of the selected password. */
    passwordConfirm: string;
    /** Indicates whether the privacy policy has been accepted. */
    privacyAccepted: boolean;
}

/**
 * Handles the login and registration flow, including guest access.
 */
@Component({
    selector: 'app-login',
    imports: [FormField, RouterLink, Intro],
    templateUrl: './login.html',
    styleUrl: './login.scss',
})
export class Login {
    private auth = inject(AuthService);
    private router = inject(Router);

    /** Tracks whether the form is in sign-up mode. */
    readonly signupMode = signal(false);
    /** Indicates whether an authentication request is in progress. */
    readonly loading = signal(false);
    /** Stores the current form error message. */
    readonly error = signal('');
    /** Shows the success toast after a successful registration. */
    readonly showSignupToast = signal(false);
    /** Controls whether the password field is visible. */
    readonly passwordVisible = signal(false);
    /** Controls whether the password confirmation field is visible. */
    readonly passwordConfirmVisible = signal(false);
    /** Checks whether the password field contains a value. */
    readonly passwordHasValue = computed(() => this.loginModel().password.length > 0);
    /** Checks whether the password confirmation field contains a value. */
    readonly passwordConfirmHasValue = computed(() => this.loginModel().passwordConfirm.length > 0);

    /** Stores the complete form state for login and signup. */
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
            message: "Please confirm your password",
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

    /**
     * Switches between login and sign-up mode and resets the form state.
     */
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

    /**
     * Submits the chosen authentication action and redirects on success.
     *
     * @param event The form submit event.
     */
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
            if (error) return (this.error.set(error), null);
            return needsSignup ? this.handleSignupSuccess() : this.navigateToSummary();
        });
    }

    /**
     * Handles a successful sign-up by switching back to the login form and showing a toast.
     */
    private handleSignupSuccess(): null {
        this.signupMode.set(false);
        this.showSignupToast.set(true);
        setTimeout(() => this.showSignupToast.set(false), 3000);
        return null;
    }

    /**
     * Navigates to the summary page after a successful login.
     */
    private async navigateToSummary(): Promise<null> {
        await this.router.navigate(['/summary']);
        return null;
    }

    /**
     * Signs in the user as a guest and redirects to the summary page.
     */
    async guestLogin() {
        this.loading.set(true);
        this.error.set('');
        const error = await this.auth.loginAsGuest();
        this.loading.set(false);

        if (error) this.error.set(error);
        else await this.router.navigate(['/summary']);
    }
}
