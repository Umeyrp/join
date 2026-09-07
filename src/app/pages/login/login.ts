import { Component } from '@angular/core';
import { Intro } from './intro/intro';

@Component({
    selector: 'app-login',
    imports: [Intro],
    templateUrl: './login.html',
    styleUrl: './login.scss',
})
export class Login {}
