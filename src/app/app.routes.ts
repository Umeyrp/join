import { Routes } from '@angular/router';
import { Login } from './pages/login/login';
import { Main } from './pages/main/main';
import { Summary } from './pages/main/summary/summary';
import { Contacts } from './pages/main/contacts/contacts';
import { ContactDetails } from './pages/main/contacts/contact-details/contact-details';

export const routes: Routes = [
  { path: 'login', component: Login },
  {
    path: '',
    component: Main,
    children: [
      { path: 'summary', component: Summary },
      { path: 'contacts', component: Contacts },
      { path: '', redirectTo: 'summary', pathMatch: 'full' },
    ],
  },
];
