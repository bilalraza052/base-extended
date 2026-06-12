import { Routes } from '@angular/router';
import { Example } from './testenv/example/example';
import { Dashboard } from './testenv/dashboard/dashboard';
import { unsavedChangesGuard } from './core/guards/unsaved-changes.guard';

export const routes: Routes = [
    {
        path: '',
        component: Example,
        canDeactivate: [unsavedChangesGuard]
    },
    {
        path: 'dashboard',
        component: Dashboard
    }
];
