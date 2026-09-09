import { Routes } from '@angular/router';

// COMPATIBILIDADE ATIVIDADENGX - guard adicionado para espelhar protecao da shell
// Shell exige login-required em src/main.ts:75; aqui protegemos /posts no nivel de rota
import { authGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'posts', pathMatch: 'full' },
  {
    path: 'posts',
    loadComponent: () =>
      // MODIFICADO: path mudou de ./components/posts -> ./features/posts/presentation (Clean Arch)
      import('./features/posts/presentation/posts.component').then((m) => m.PostsComponent),
    canActivate: [authGuard], // ADICIONADO: exige Keycloak autenticado, senao -> /unauthorized
  },
  {
    // ADICIONADO para compatibilidade com shell: rota de fallback quando guard falha
    // Shell mostra login-required; aqui redireciona para componente amigavel em vez de loop
    path: 'unauthorized',
    loadComponent: () =>
      import('./shared/components/unauthorized/unauthorized.component').then(
        (m) => m.UnauthorizedComponent,
      ),
  },
  { path: '**', redirectTo: 'posts' },
];
