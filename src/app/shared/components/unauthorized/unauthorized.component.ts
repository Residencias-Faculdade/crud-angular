import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { KeycloakService } from '../../../core/auth/keycloak.service';

@Component({
  selector: 'app-unauthorized',
  standalone: true,
  template: `
    <div class="unauthorized">
      <h2>Acesso negado</h2>
      <p>Voce precisa estar autenticado para acessar esta pagina.</p>
      <button type="button" (click)="login()" class="btn btn-primary">Entrar com Keycloak</button>
    </div>
  `,
  styles: [
    '.unauthorized{max-width:600px;margin:40px auto;padding:24px;border:1px solid #e5e7eb;border-radius:12px;text-align:center}',
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UnauthorizedComponent {
  private readonly keycloak = inject(KeycloakService);

  login(): void {
    void this.keycloak.login();
  }
}
