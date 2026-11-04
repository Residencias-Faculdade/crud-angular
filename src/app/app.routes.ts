import { Routes } from '@angular/router';

import { authGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'posts', pathMatch: 'full' },
  {
    path: 'posts',
    loadComponent: () =>
      import('./features/posts/presentation/posts.component').then((m) => m.PostsComponent),
    canActivate: [authGuard],
  },
  {
    path: 'lab',
    loadComponent: () => import('./lab/crud/crud-lab.component').then((m) => m.CrudLabComponent),
  },
  {
    path: 'unauthorized',
    loadComponent: () =>
      import('./shared/components/unauthorized/unauthorized.component').then(
        (m) => m.UnauthorizedComponent,
      ),
  },
  { path: '**', redirectTo: 'posts' },
];
