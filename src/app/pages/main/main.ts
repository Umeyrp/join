import { Component } from '@angular/core';
import { Header } from '../../shared/header/header';
import { Navbar } from '../../shared/navbar/navbar';
import { Summary } from './summary/summary';
import { Contacts } from './contacts/contacts';

@Component({
  selector: 'app-main',
  imports: [Header, Navbar, Summary, Contacts],
  templateUrl: './main.html',
  styleUrl: './main.scss',
})
export class Main {}
