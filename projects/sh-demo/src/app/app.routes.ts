import { Routes } from '@angular/router';
import { ContactsPage } from './pages/contacts';
import { FormsPage } from './pages/forms';
import { DialogsPage } from './pages/dialogs';
import { Example } from './pages/example/example';

export const routes: Routes = [
  { path: '', redirectTo: 'contacts', pathMatch: 'full' },
  { path: 'contacts', component: ContactsPage },
  { path: 'forms', component: FormsPage },
  { path: 'dialogs', component: DialogsPage },
  { path: 'more', component: Example },
];
