import { Routes } from '@angular/router';
import { Login } from './pages/login/login';
import { Main } from './pages/main/main';
import { Summary } from './pages/main/summary/summary';
import { Contacts } from './pages/main/contacts/contacts';
import { ContactDetails } from './pages/main/contacts/contact-details/contact-details';
import { AddTask } from './pages/main/add-task/add-task';
import { Board } from './pages/main/board/board';
import { Help } from './pages/main/help/help';
import { PrivacyPolicy } from './pages/main/privacy-policy/privacy-policy';
import { LegaNotice } from './pages/main/lega-notice/lega-notice';

export const routes: Routes = [
    { path: 'login', component: Login },
    {
        path: '',
        component: Main,
        children: [
            { path: 'summary', component: Summary },
            {
                path: 'contacts',
                component: Contacts,
                children: [{ path: ':id', component: ContactDetails }],
            },
            { path: 'add-task', component: AddTask },
            { path: 'board', component: Board },
            { path: 'help', component: Help },
            { path: 'privacy-policy', component: PrivacyPolicy },
            { path: 'legal-notice', component: LegaNotice },
            { path: '', redirectTo: 'summary', pathMatch: 'full' },
        ],
    },
];
