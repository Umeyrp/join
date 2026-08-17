import { Routes } from '@angular/router';
import { Login } from './pages/login/login';
import { Main } from './pages/main/main';
import { Summary } from './pages/main/summary/summary';

export const routes: Routes = [
  { path: 'login', component: Login },
  {
    path: '',
    component: Main,
    children: [
      { path: 'summary', component: Summary },
      { path: '', redirectTo: 'summary', pathMatch: 'full' },
    ],
  },
];
