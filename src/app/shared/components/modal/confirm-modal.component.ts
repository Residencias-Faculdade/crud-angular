import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'app-confirm-modal',
  standalone: true,
  template: `
    @if (open()) {
      <div class="modal-overlay" (click)="cancel.emit()" role="presentation">
        <div
          class="modal"
          role="dialog"
          aria-modal="true"
          [attr.aria-labelledby]="'modal-title'"
          (click)="$event.stopPropagation()"
        >
          <h3 id="modal-title">{{ title() }}</h3>
          <p>{{ message() }}</p>
          <div class="actions modal-actions">
            <button type="button" (click)="cancel.emit()" class="btn btn-ghost">Cancelar</button>
            <button type="button" (click)="confirm.emit()" class="btn btn-danger">Confirmar</button>
          </div>
        </div>
      </div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmModalComponent {
  readonly open = input.required<boolean>();
  readonly title = input.required<string>();
  readonly message = input.required<string>();
  readonly confirm = output<void>();
  readonly cancel = output<void>();
}
